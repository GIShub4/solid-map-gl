import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { MGL_Image, symbolList, patternList } from "./index";
import { SYMBOL } from "./shapes";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { createMockMap, tick } from "../../testUtils/mockMap";

afterEach(cleanup);

/** Stub the 2D canvas context jsdom doesn't implement, for the pattern renderer and the
 *  canvas-fallback branch of `_loadImage`'s error handler. */
function stubCanvasContext() {
  const fakeCtx: any = {
    imageSmoothingEnabled: false,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    scale: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    getImageData: vi.fn(() => ({ width: 1, height: 1, data: new Uint8Array(4) })),
  };
  const spy = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(fakeCtx);
  (spy as any).fakeCtx = fakeCtx;
  return spy;
}

describe("MGL_Image", () => {
  it("calls loadImage then addImage for a URL source", async () => {
    const { map } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />);
    await tick();
    await tick();
    expect(map.loadImage).toHaveBeenCalledWith("pin.png", expect.any(Function));
    expect(map.addImage).toHaveBeenCalledWith(
      "pin",
      expect.objectContaining({ width: 1, height: 1 }),
      undefined,
    );
  });

  it("adds a non-string image source (e.g. ImageData-like) directly without calling loadImage", async () => {
    const source = { width: 2, height: 2, data: new Uint8Array(16) };
    const { map } = renderWithMap(() => <MGL_Image id="raw" source={source as any} />);
    await tick();
    expect(map.loadImage).not.toHaveBeenCalled();
    expect(map.addImage).toHaveBeenCalledWith("raw", source, undefined);
  });

  it("generates a canvas-backed pattern via onAdd/render instead of calling loadImage", async () => {
    const { map } = renderWithMap(() => (
      <MGL_Image id="hatch" pattern={{ type: "diagonal_l", color: "#000", background: "#fff", lineWidth: 1 }} />
    ));
    await tick();
    expect(map.loadImage).not.toHaveBeenCalled();
    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "hatch");
    expect(call).toBeTruthy();
    expect(typeof call[1].onAdd).toBe("function");
    expect(typeof call[1].render).toBe("function");
  });

  it("updateImage is used on a reactive re-run once the loaded size matches the previous load", async () => {
    const [seed, setSeed] = createSignal(0);
    const { map } = renderWithMap(() => (
      <MGL_Image id="pin" source="pin.png" options={{ seed: seed() } as any} />
    ));
    await tick();
    await tick();
    expect(map.updateImage).not.toHaveBeenCalled();

    map.hasImage.mockReturnValue(true);
    setSeed(1);
    await tick();
    await tick();

    expect(map.updateImage).toHaveBeenCalled();
  });

  it("removes the image on cleanup if present", async () => {
    const { map, unmount } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />);
    await tick();
    map.hasImage.mockReturnValue(true);
    unmount();
    expect(map.removeImage).toHaveBeenCalledWith("pin");
  });

  it("throws if neither source nor pattern is given", () => {
    expect(() => renderWithMap(() => <MGL_Image id="broken" />)).toThrow(
      /Image, Pattern or Symbol is required/,
    );
  });

  it("throws if no id is given", () => {
    expect(() =>
      renderWithMap(() => <MGL_Image id={undefined as any} source="pin.png" />),
    ).toThrow(/ID is required/);
  });

  it("re-adds the image on style.load if it's no longer present", async () => {
    const { map } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />);
    await tick();
    await tick();
    map.addImage.mockClear();
    map.hasImage.mockReturnValue(false);

    map.fire("style.load", {});

    expect(map.addImage).toHaveBeenCalledWith(
      "pin",
      expect.objectContaining({ width: 1, height: 1 }),
      undefined,
    );
  });

  it("does not re-add on style.load if the image is already present", async () => {
    const { map } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />);
    await tick();
    await tick();
    map.addImage.mockClear();
    map.hasImage.mockReturnValue(true);

    map.fire("style.load", {});

    expect(map.addImage).not.toHaveBeenCalled();
  });

  it("parses an inline SVG string, applies fill/stroke, and loads the serialized result", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>';
    const { map } = renderWithMap(() => (
      <MGL_Image
        id="svg-pin"
        source={svg}
        options={{ fill: "#f00", stroke: "#00f" } as any}
      />
    ));
    await tick();
    await tick();

    expect(map.loadImage).toHaveBeenCalledWith(
      expect.stringContaining("<rect"),
      expect.any(Function),
    );
    const [loadedSource] = map.loadImage.mock.calls[0];
    expect(loadedSource).toContain('fill="#f00"');
    expect(loadedSource).toContain('stroke="#00f"');
  });

  it("resolves a predefined symbol name to its built-in markup", async () => {
    const { map } = renderWithMap(() => <MGL_Image id="tri" symbol="triangle" />);
    await tick();
    await tick();

    expect(map.loadImage).toHaveBeenCalledWith(
      SYMBOL.triangle,
      expect.any(Function),
    );
  });

  it("treats full custom SVG markup passed to symbol the same as a source SVG", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>';
    const { map } = renderWithMap(() => (
      <MGL_Image id="custom" symbol={svg} options={{ fill: "#0f0" } as any} />
    ));
    await tick();
    await tick();

    const [loadedSource] = map.loadImage.mock.calls[0];
    expect(loadedSource).toContain("<rect");
    expect(loadedSource).toContain('fill="#0f0"');
  });

  it("wraps a raw SVG path's d data passed to symbol in the shared viewBox template", async () => {
    const { map } = renderWithMap(() => (
      <MGL_Image id="custom-path" symbol="M0 0 10 10 0 10Z" />
    ));
    await tick();
    await tick();

    expect(map.loadImage).toHaveBeenCalledWith(
      expect.stringContaining('d="M0 0 10 10 0 10Z"'),
      expect.any(Function),
    );
  });

  it("ignores symbol when source is also given", async () => {
    const { map } = renderWithMap(() => (
      <MGL_Image id="pin" source="pin.png" symbol="triangle" />
    ));
    await tick();
    await tick();

    expect(map.loadImage).toHaveBeenCalledWith("pin.png", expect.any(Function));
  });

  it("exports every built-in symbol/pattern name via symbolList/patternList", () => {
    expect(symbolList).toEqual(
      expect.arrayContaining([
        "square",
        "circle",
        "triangle",
        "diamond",
        "pentagon",
        "hexagon",
        "octagon",
        "cross",
        "x",
        "star",
      ]),
    );
    expect(patternList).toEqual(
      expect.arrayContaining([
        "diagonal_l",
        "diagonal_r",
        "horizontal",
        "vertical",
        "cross",
        "hash",
        "chevron_h",
        "chevron_v",
        "square",
        "hex",
        "circle",
        "grid",
        "brick",
        "wave",
      ]),
    );
  });

  it("falls back to canvas rendering when loadImage errors for a non-svg url", async () => {
    const restoreCanvas = stubCanvasContext();
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(() => <MGL_Image id="pin" source="http://example.com/pin.png" />, { map });
    await tick();

    expect(capturedImg).toBeTruthy();
    capturedImg!.onload!(new Event("load"));

    expect(map.addImage).toHaveBeenCalledWith(
      "pin",
      expect.objectContaining({ width: 1, height: 1 }),
      { pixelRatio: 1 },
    );

    window.Image = OrigImage;
    restoreCanvas.mockRestore();
  });

  it("fetches and re-parses an .svg url when loadImage errors", async () => {
    const restoreCanvas = stubCanvasContext();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>';
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({ text: () => Promise.resolve(svg) } as any);
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(
      () => (
        <MGL_Image
          id="pin"
          source="http://example.com/pin.svg"
          options={{ fill: "#f00", stroke: "#00f", transform: "scale(1)" } as any}
        />
      ),
      { map },
    );
    await tick();
    await tick();
    await tick();

    expect(capturedImg).toBeTruthy();
    await capturedImg!.onload!(new Event("load"));

    expect(fetchSpy).toHaveBeenCalledWith("http://example.com/pin.svg");
    expect(map.addImage).toHaveBeenCalledWith(
      "pin",
      expect.objectContaining({ width: 1, height: 1 }),
      expect.objectContaining({ fill: "#f00", stroke: "#00f" }),
    );

    window.Image = OrigImage;
    restoreCanvas.mockRestore();
  });

  it("renders a pattern's canvas onAdd/render lifecycle", async () => {
    const restoreCanvas = stubCanvasContext();
    const { map } = renderWithMap(() => (
      <MGL_Image
        id="hatch"
        pattern={{ type: "square", color: "#000", background: "#fff", lineWidth: 2 }}
      />
    ));
    await tick();

    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "hatch");
    const fakeThis: any = {};
    call[1].onAdd.call(fakeThis);
    expect(call[1].render.call(fakeThis)).toBe(true);

    restoreCanvas.mockRestore();
  });

  it("falls back to transparent/black/1px defaults and skips fill() for a non-fill pattern", async () => {
    const restoreCanvas = stubCanvasContext();
    const { map } = renderWithMap(() => (
      <MGL_Image id="hatch" pattern={{ type: "diagonal_l" } as any} />
    ));
    await tick();

    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "hatch");
    const fakeThis: any = {};
    call[1].onAdd.call(fakeThis);
    call[1].render.call(fakeThis);

    expect(fakeThis.ctx.fillStyle).toBe("black");
    expect(fakeThis.ctx.lineWidth).toBe(1);
    expect(fakeThis.ctx.fill).not.toHaveBeenCalled();

    restoreCanvas.mockRestore();
  });

  it("falls back to a hardcoded pixelRatio when devicePixelRatio is unset", async () => {
    const restoreCanvas = stubCanvasContext();
    const originalRatio = window.devicePixelRatio;
    // @ts-ignore
    delete window.devicePixelRatio;

    const { map } = renderWithMap(() => (
      <MGL_Image id="hatch" pattern={{ type: "diagonal_l", color: "#000" } as any} />
    ));
    await tick();

    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "hatch");
    expect(call[2]).toEqual(expect.objectContaining({ pixelRatio: 2 }));

    window.devicePixelRatio = originalRatio;
    restoreCanvas.mockRestore();
  });

  it("logs debug output for add and remove when map.debug is enabled", async () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const map = createMockMap();
    map.debug = true;
    const { unmount } = renderWithMap(() => <MGL_Image id="pin" source="pin.png" />, { map });
    await tick();
    await tick();

    expect(debugSpy).toHaveBeenCalledWith(
      "%c[MapGL]",
      "color: #10b981",
      "Add Image:",
      "pin",
    );

    unmount();
    expect(debugSpy).toHaveBeenCalledWith(
      "%c[MapGL]",
      "color: #10b981",
      "Remove Image:",
      "pin",
    );

    debugSpy.mockRestore();
  });

  it("falls back to a hardcoded pixelRatio for canvas rendering when devicePixelRatio is unset", async () => {
    const restoreCanvas = stubCanvasContext();
    const originalRatio = window.devicePixelRatio;
    // @ts-ignore
    delete window.devicePixelRatio;
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(() => <MGL_Image id="pin" source="http://example.com/pin.png" />, { map });
    await tick();

    expect(capturedImg).toBeTruthy();
    capturedImg!.onload!(new Event("load"));

    expect(map.addImage).toHaveBeenCalledWith(
      "pin",
      expect.objectContaining({ width: 1, height: 1 }),
      { pixelRatio: 1 },
    );

    window.Image = OrigImage;
    window.devicePixelRatio = originalRatio;
    restoreCanvas.mockRestore();
  });

  it("folds the 50px raster-crispness floor-scale into the reported pixelRatio, not just devicePixelRatio", async () => {
    const restoreCanvas = stubCanvasContext();
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(() => <MGL_Image id="pin" source="http://example.com/pin.png" />, { map });
    await tick();

    expect(capturedImg).toBeTruthy();
    // A 20px source needs a 50/20 = 2.5x floor-scale to reach the 50px raster-crispness floor.
    // If that factor isn't folded into the reported pixelRatio alongside devicePixelRatio (1 in
    // jsdom), mapbox displays the icon at 2.5x its authored 20px CSS size instead of 20px.
    Object.defineProperty(capturedImg, "width", { value: 20, configurable: true });
    Object.defineProperty(capturedImg, "height", { value: 20, configurable: true });
    capturedImg!.onload!(new Event("load"));

    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "pin");
    expect(call[2]).toEqual(expect.objectContaining({ pixelRatio: 2.5 }));

    window.Image = OrigImage;
    restoreCanvas.mockRestore();
  });

  it("sets sdf:true on the addImage metadata and pads the raster before rasterizing when sdf is used", async () => {
    const restoreCanvas = stubCanvasContext();
    const fakeCtx = (restoreCanvas as any).fakeCtx;
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(
      () => <MGL_Image id="pin" source="http://example.com/pin.png" sdf />,
      { map },
    );
    await tick();

    expect(capturedImg).toBeTruthy();
    capturedImg!.onload!(new Event("load"));

    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "pin");
    expect(call[2]).toEqual(expect.objectContaining({ sdf: true }));
    // Default radius is 8; devicePixelRatio is 1 in jsdom by default, so drawImage
    // should be offset by 8px on each axis to leave room for the SDF's halo gradient.
    expect(fakeCtx.drawImage).toHaveBeenCalledWith(
      capturedImg,
      8,
      8,
      expect.any(Number),
      expect.any(Number),
    );

    window.Image = OrigImage;
    restoreCanvas.mockRestore();
  });

  it("honors a custom radius passed as an sdf object", async () => {
    const restoreCanvas = stubCanvasContext();
    const fakeCtx = (restoreCanvas as any).fakeCtx;
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(
      () => (
        <MGL_Image id="pin" source="http://example.com/pin.png" sdf={{ radius: 2 }} />
      ),
      { map },
    );
    await tick();

    capturedImg!.onload!(new Event("load"));

    expect(fakeCtx.drawImage).toHaveBeenCalledWith(
      capturedImg,
      2,
      2,
      expect.any(Number),
      expect.any(Number),
    );

    window.Image = OrigImage;
    restoreCanvas.mockRestore();
  });

  // Regression test: loadImage's callback can hand back an ImageBitmap (no `.data`) just as
  // readily as an ImageData — the success path (unlike the error/canvas-fallback path above,
  // exercised by every other sdf test in this file) used to pass that straight into toSDF()
  // unconverted, which throws at runtime for anything without a `.data` array.
  it("pads and rasterizes an ImageBitmap-shaped loadImage result before SDF-encoding it", async () => {
    const restoreCanvas = stubCanvasContext();
    const fakeCtx = (restoreCanvas as any).fakeCtx;
    // No `.data` — matches what mapbox-gl-js's real loadImage commonly resolves to
    // (createImageBitmap) for a plain raster URL, unlike this repo's mock default.
    const bitmap = { width: 10, height: 10 };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(null, bitmap));
    renderWithMap(() => <MGL_Image id="pin" source="http://example.com/pin.png" sdf />, {
      map,
    });
    await tick();
    await tick();

    // Default radius is 8, so the padded canvas draws the bitmap offset by 8px on each axis.
    expect(fakeCtx.drawImage).toHaveBeenCalledWith(bitmap, 8, 8, 10, 10);
    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "pin");
    expect(call[2]).toEqual(expect.objectContaining({ sdf: true }));

    restoreCanvas.mockRestore();
  });

  it("pads an already-ImageData loadImage result via putImageData before SDF-encoding it", async () => {
    const restoreCanvas = stubCanvasContext();
    const fakeCtx = (restoreCanvas as any).fakeCtx;
    fakeCtx.putImageData = vi.fn();
    const imageData = { width: 10, height: 10, data: new Uint8ClampedArray(10 * 10 * 4) };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(null, imageData));
    renderWithMap(() => <MGL_Image id="pin" source="http://example.com/pin.png" sdf />, {
      map,
    });
    await tick();
    await tick();

    expect(fakeCtx.putImageData).toHaveBeenCalledWith(imageData, 8, 8);
    expect(fakeCtx.drawImage).not.toHaveBeenCalled();

    restoreCanvas.mockRestore();
  });

  it("does not pad or tag addImage metadata when sdf is not set", async () => {
    const restoreCanvas = stubCanvasContext();
    const fakeCtx = (restoreCanvas as any).fakeCtx;
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(
      () => <MGL_Image id="pin" source="http://example.com/pin.png" />,
      { map },
    );
    await tick();

    capturedImg!.onload!(new Event("load"));

    const call = map.addImage.mock.calls.find((c: any[]) => c[0] === "pin");
    expect(call[2]).not.toHaveProperty("sdf");
    expect(fakeCtx.drawImage).toHaveBeenCalledWith(
      capturedImg,
      0,
      0,
      expect.any(Number),
      expect.any(Number),
    );

    window.Image = OrigImage;
    restoreCanvas.mockRestore();
  });

  it("logs an error via img.onerror when the canvas-fallback image fails to decode", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let capturedImg: HTMLImageElement | undefined;
    const OrigImage = window.Image;
    // @ts-ignore
    window.Image = class extends OrigImage {
      constructor() {
        super();
        capturedImg = this;
      }
    };

    const map = createMockMap();
    map.loadImage.mockImplementation((_url: string, cb: any) => cb(new Error("fail")));
    renderWithMap(() => <MGL_Image id="pin" source="http://example.com/pin.png" />, { map });
    await tick();

    expect(capturedImg).toBeTruthy();
    const fakeErrorEvent = new Event("error");
    capturedImg!.onerror!(fakeErrorEvent);

    expect(errorSpy).toHaveBeenCalledWith(
      '[MapGL] Image "pin" failed to load:',
      fakeErrorEvent,
    );

    window.Image = OrigImage;
    errorSpy.mockRestore();
  });
});
