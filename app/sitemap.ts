import { MetadataRoute } from 'next'
 
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://yourdomain.com'
  
  // Define all your static routes
  const routes = [
    '',
    '/about',
    '/services',
    '/portfolio',
    '/contact',
    '/privacy',
    '/terms',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : route === '/portfolio' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/services' || route === '/contact' ? 0.9 : 0.8,
  }))
}
