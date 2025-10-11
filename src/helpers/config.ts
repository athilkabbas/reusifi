export const Platform = {
  isIOS:
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
  isAndroid: /Android/.test(navigator.userAgent),
};
