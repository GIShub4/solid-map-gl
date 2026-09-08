import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Popup } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Popup", () => {
  it("throws if neither lngLat nor trackPointer is given", () => {
    expect(() => renderWithMap(() => <Popup />)).toThrow(
      /lngLat or trackPointer is required/,
    );
  });

  it("creates a popup, sets its lngLat and adds it to the map", async () => {
    const { map, mapLib } = renderWithMap(() => <Popup lngLat={[1, 2]}>hi</Popup>);
    await tick();
    const popup = mapLib.Popup.instances[0];
    expect(popup.addTo).toHaveBeenCalledWith(map);
    expect(popup.setLngLat).toHaveBeenCalledWith([1, 2]);
    expect(popup.trackPointer).not.toHaveBeenCalled();
  });

  it("calls trackPointer instead of setLngLat when trackPointer is set", async () => {
    const { mapLib } = renderWithMap(() => <Popup trackPointer>hi</Popup>);
    await tick();
    const popup = mapLib.Popup.instances[0];
    expect(popup.trackPointer).toHaveBeenCalled();
    expect(popup.setLngLat).not.toHaveBeenCalled();
  });

  it("sets HTML content for a string child, DOM content otherwise", async () => {
    const { mapLib, unmount } = renderWithMap(() => <Popup lngLat={[1, 2]}>hi</Popup>);
    await tick();
    expect(mapLib.Popup.instances[0].setHTML).toHaveBeenCalledWith("hi");
    unmount();

    const el = document.createElement("div");
    const { mapLib: mapLib2 } = renderWithMap(() => <Popup lngLat={[1, 2]}>{el}</Popup>);
    await tick();
    expect(mapLib2.Popup.instances[0].setDOMContent).toHaveBeenCalledWith(el);
  });

  it("updates position reactively when lngLat changes", async () => {
    const [pos, setPos] = createSignal<[number, number]>([1, 2]);
    const { mapLib } = renderWithMap(() => <Popup lngLat={pos()}>hi</Popup>);
    await tick();
    const popup = mapLib.Popup.instances[0];

    setPos([3, 4]);
    await tick();

    expect(popup.setLngLat).toHaveBeenLastCalledWith([3, 4]);
  });

  it("fires onOpen/onClose via the popup's open/close events", async () => {
    const events: string[] = [];
    const { mapLib } = renderWithMap(() => (
      <Popup lngLat={[1, 2]} onOpen={() => events.push("open")} onClose={() => events.push("close")}>
        hi
      </Popup>
    ));
    await tick();
    const popup = mapLib.Popup.instances[0];
    popup.on.mock.calls.find((c: any[]) => c[0] === "open")[1]();
    popup.on.mock.calls.find((c: any[]) => c[0] === "close")[1]();
    expect(events).toEqual(["open", "close"]);
  });

  it("removes the popup on cleanup", async () => {
    const { mapLib, unmount } = renderWithMap(() => <Popup lngLat={[1, 2]}>hi</Popup>);
    await tick();
    const popup = mapLib.Popup.instances[0];
    unmount();
    expect(popup.remove).toHaveBeenCalled();
  });
});
