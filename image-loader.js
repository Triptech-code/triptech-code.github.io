export default function imageLoader({ src, width, quality }) {
  const basePath = process.env.NODE_ENV === "production" ? "/fantastic-breaks-" : ""
  return `${basePath}${src}?w=${width}&q=${quality || 75}`
}
