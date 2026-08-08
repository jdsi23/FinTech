// Rewrites the page's home-screen branding tags so the NEXT time the
// current user adds the site to their phone's home screen, it reflects
// their personal name/icon. There is no API to update an icon already
// pinned on a device -- iOS reads apple-mobile-web-app-title/apple-touch-icon
// live from the DOM at "Add to Home Screen" time (not manifest.json);
// Android/Chrome uses whatever <link rel="manifest"> currently points to,
// so a per-user dynamic manifest (built here as a Blob URL) covers it too.

let lastManifestUrl: string | null = null

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applyHomeScreenBranding(name: string, iconUrl: string) {
  setMetaTag('apple-mobile-web-app-title', name)
  setMetaTag('apple-mobile-web-app-capable', 'yes')
  setMetaTag('mobile-web-app-capable', 'yes')
  setLinkTag('apple-touch-icon', iconUrl)

  const manifest = {
    name,
    short_name: name,
    start_url: '.',
    display: 'standalone',
    icons: [
      { src: iconUrl, sizes: '192x192', type: 'image/png' },
      { src: iconUrl, sizes: '512x512', type: 'image/png' },
    ],
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/json' }))
  setLinkTag('manifest', url)
  if (lastManifestUrl) URL.revokeObjectURL(lastManifestUrl)
  lastManifestUrl = url
}
