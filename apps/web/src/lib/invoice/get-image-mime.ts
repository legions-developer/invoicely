const mimeTypes = {
  png: "image/png",
  gif: "image/gif",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  jpeg: "image/jpeg",
  pjpeg: "image/jpeg",
  pjp: "image/jpeg",
  jfif: "image/jpeg",
};

function getImageMime(base64Encoded: string) {
  if (base64Encoded.startsWith("data:")) {
    const found = base64Encoded.match(/data:\S*;base64/g);
    return found && found[0].slice("data:".length, ";base64".length * -1);
  } else {
    const prefix = atob(base64Encoded.slice(0, 60));
    const found = prefix.match(/(webp)|(png)|(gif)|(svg)|(jpg)|(jpeg)|(pjpeg)|(pjp)|(jfif)/gi);
    if (!found) {
      const hex = Buffer.from(base64Encoded, "base64").toString("hex");
      if (hex.startsWith("ffd8ff")) return mimeTypes.jpeg;
      return null;
    } else {
      const type = found[0].toLocaleLowerCase();
      return mimeTypes[type as keyof typeof mimeTypes];
    }
  }
}

export const getImageMimeType = getImageMime;
