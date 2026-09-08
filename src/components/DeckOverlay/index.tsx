import { createEffect, VoidComponent } from "solid-js";
import { useMapContext } from "../MapProvider";
import { useControlPosition } from "../../lib/createMapControl";

type Props = {
  /** The deck.gl overlay class matching the active base library — `MapboxOverlay` from
   * `@deck.gl/mapbox` for Mapbox, `MapLibreOverlay` from `@deck.gl/maplibre` for MapLibre.
   * solid-map-gl never imports either package itself; you supply the class. */
  overlay: new (props: any) => any;
  /** Props forwarded to the deck.gl overlay, e.g. `{ layers, interleaved }` */
  props?: any;
};

/** Adds a deck.gl overlay control to the map, forwarding `props` reactively via `setProps`. */
export const DeckOverlay: VoidComponent<Props> = (props) => {
  const [ctx] = useMapContext();
  let overlay: any;

  const control = () => {
    if (!overlay) overlay = new props.overlay(props.props || {});
    return overlay;
  };

  useControlPosition(control);

  createEffect(() => overlay?.setProps(props.props || {}));

  return null;
};
