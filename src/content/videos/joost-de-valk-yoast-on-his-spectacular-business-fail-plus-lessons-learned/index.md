---
title: Joost de Valk (Yoast) on His Spectacular Business Fail + Lessons Learned
seo:
  title: A spectacular business fail and lessons learned
publishDate: 2023-11-16T00:00:00.000Z
youtubeId: 5QyFwORsqWs
videoUrl: 'https://www.youtube.com/watch?v=5QyFwORsqWs'
duration: PT1M12S
featureImage: ./images/thumbnail.jpg
featureImageAlt: Joost de Valk (Yoast) on His Spectacular Business Fail + Lessons Learned
type: interview
---
A short clip where I describe one of the worst bugs we shipped at Yoast. We had disabled WordPress attachment URLs to protect SEO, and in a release we accidentally re-enabled them. Suddenly all those URLs were being indexed by search engines, creating a mass of thin pages and wrecking SEO for sites with lots of images. We had to build an emergency plugin to purge those URLs from both the site and Google's index. My main lesson: build automated tests for everything.
