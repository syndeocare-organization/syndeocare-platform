import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SyndeoCare",
    short_name: "SyndeoCare",
    description: "Trusted care professionals and healthcare teams, connected.",
    start_url: "/ar",
    display: "standalone",
    background_color: "#fcfbf7",
    theme_color: "#155f74",
    icons: [{ src: "/brand/syndeocare-mark.png", sizes: "184x179", type: "image/png" }],
  };
}
