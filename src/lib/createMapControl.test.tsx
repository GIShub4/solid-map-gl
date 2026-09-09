import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { useControlPosition } from "./createMapControl";
import { renderWithMap } from "../testUtils/renderWithMap";
import { tick } from "../testUtils/mockMap";

afterEach(cleanup);

const Probe = (props: { control: () => any }) => {
  useControlPosition(props.control);
  return null;
};

describe("useControlPosition", () => {
  it("does nothing when the control accessor returns falsy", async () => {
    const { map } = renderWithMap(() => <Probe control={() => null} />);
    await tick();
    expect(map.addControl).not.toHaveBeenCalled();
  });
});
