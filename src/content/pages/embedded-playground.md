---
title: Embedded playground
---
This playground below is embedded through the [playground embedder plugin](https://github.com/jdevalk/playground-embedder/), with a simple [blueprint](https://wordpress.github.io/wordpress-playground/docs/blueprints-api/index) to log in and install & activate a plugin (Yoast SEO):

The embed code used is:

```json
[wp_playground width=1100 height=1000]
{
    "landingPage": "/wp-admin/",
    "preferredVersions": {
        "php": "8.0",
        "wp": "latest"
    },
    "steps": [
        {
            "step": "login",
            "username": "admin",
            "password": "password"
        },
        {
            "step": "installPlugin",
            "pluginZipFile": {
                "resource": "wordpress.org/plugins",
                "slug": "wordpress-seo"
            },
            "options": {
                "activate": true
            }
        }
    ]
}
[/wp_playground]
```
