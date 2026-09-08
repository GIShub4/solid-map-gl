import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Marker } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";
import { tick } from "../../testUtils/mockMap";

afterEach(cleanup);

describe("Marker", () => {
  it("throws if lngLat is not given", () => {
    expect(() => renderWithMap(() => <Marker lngLat={undefined as any} />)).toThrow(
      /lngLat is required/,
    );
  });

  it("creates a marker, sets its lngLat and adds it to the map", async () => {
    const { map, mapLib } = renderWithMap(() => <Marker lngLat={[1, 2]} />);
    await tick();
    const marker = mapLib.Marker.instances[0];
    expect(marker.setLngLat).toHaveBeenCalledWith([1, 2]);
    expect(marker.addTo).toHaveBeenCalledWith(map);
  });

  it("sets the popup's HTML content for a string child", async () => {
    const { mapLib } = renderWithMap(() => <Marker lngLat={[1, 2]}>hello</Marker>);
    await tick();
    const popup = mapLib.Popup.instances[0];
    expect(popup.setHTML).toHaveBeenCalledWith("hello");
    expect(popup.setDOMContent).not.toHaveBeenCalled();
  });

  it("sets the popup's DOM content for a non-string child", async () => {
    const el = document.createElement("div");
    const { mapLib } = renderWithMap(() => <Marker lngLat={[1, 2]}>{el}</Marker>);
    await tick();
    const popup = mapLib.Popup.instances[0];
    expect(popup.setDOMContent).toHaveBeenCalledWith(el);
  });

  it("updates marker position when lngLat changes", async () => {
    const [pos, setPos] = createSignal<[number, number]>([1, 2]);
    const { mapLib } = renderWithMap(() => <Marker lngLat={pos()} />);
    await tick();
    const marker = mapLib.Marker.instances[0];

    setPos([3, 4]);
    await tick();

    expect(marker.setLngLat).toHaveBeenLastCalledWith([3, 4]);
  });

  it("toggles the popup when showPopup diverges from the popup's open state", async () => {
    const [show, setShow] = createSignal(false);
    const { mapLib } = renderWithMap(() => <Marker lngLat={[1, 2]} showPopup={show()} />);
    await tick();
    const marker = mapLib.Marker.instances[0];

    setShow(true);
    await tick();

    expect(marker.togglePopup).toHaveBeenCalled();
  });

  it("fires onDragStart/onDrag/onDragEnd callbacks wired to the marker's drag events", async () => {
    const events: string[] = [];
    const { mapLib } = renderWithMap(() => (
      <Marker
        lngLat={[1, 2]}
        onDragStart={() => events.push("start")}
        onDrag={() => events.push("drag")}
        onDragEnd={() => events.push("end")}
      />
    ));
    await tick();
    const marker = mapLib.Marker.instances[0];
    const dragstart = marker.on.mock.calls.find((c: any[]) => c[0] === "dragstart")[1];
    const drag = marker.on.mock.calls.find((c: any[]) => c[0] === "drag")[1];
    const dragend = marker.on.mock.calls.find((c: any[]) => c[0] === "dragend")[1];

    dragstart();
    drag();
    dragend();

    expect(events).toEqual(["start", "drag", "end"]);
  });

  it("removes the marker on cleanup", async () => {
    const { mapLib, unmount } = renderWithMap(() => <Marker lngLat={[1, 2]} />);
    await tick();
    const marker = mapLib.Marker.instances[0];
    unmount();
    expect(marker.remove).toHaveBeenCalled();
  });
});
