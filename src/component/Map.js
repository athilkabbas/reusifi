import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { callApi } from "../helpers/api";
import { useIsMobile } from "../hooks/windowSize";
import { Skeleton } from "antd";

const AwsMap = ({ center, zoom }) => {
  const mapContainer = useRef(null);
  const style = "Standard";
  const colorScheme = "Light";
  const isMobile = useIsMobile();

  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    let map;
    const createMap = async () => {
      try {
        setMapLoading(true);
        const results = await callApi(
          `https://api.reusifi.com/prod/getMap?center=${center}&style=${style}&colorScheme=${colorScheme}`,
          "GET"
        );
        if (!mapContainer.current) return;

        map = new maplibregl.Map({
          container: mapContainer.current,
          style: results.data,
          center,
          zoom,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-left");
        map.scrollZoom.disable();
        map.dragPan.disable();
        map.touchZoomRotate.enable();
        new maplibregl.Marker({ color: "#ff0000" })
          .setLngLat(center)
          .addTo(map);
        map.on("load", () => {
          setMapLoading(false);
        });
      } catch (err) {
        setMapLoading(false);
      }
    };

    createMap();

    return () => {
      if (map) map.remove();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {mapLoading && (
        <Skeleton.Node
          style={{
            width: isMobile ? "calc(100dvw - 50px)" : "50dvw",
            height: "400px",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 10,
          }}
          active
        />
      )}
      <div
        ref={mapContainer}
        style={{
          width: isMobile ? "calc(100dvw - 50px)" : "50dvw",
          height: "400px",
        }}
      />
    </div>
  );
};

export default AwsMap;
