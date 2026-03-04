---
title: 'WordPress comments, cookies and caching'
publishDate: 2025-01-01T00:00:00.000Z
excerpt: >-
  This post explains how WordPress uses comment cookies and why that is
  detrimental to your site’s caching. It then shows you how to fix this.
categories:
  - WordPress
featureImage:
  src: ./images/wordpress-comment-cookies-and-caching-1-png.webp
  alt: ''
---
This post explains how WordPress uses comment cookies and why that is detrimental to your site’s caching. It then shows you how to fix this.

When I wrote my previous post about [WordPress leadership](/wordpress-leadership/), I had anticipated getting a lot of comments. It turned out there were even more than I expected. This led to some issues with my (admittedly rather aggressive) caching settings on my blog. When I approved a comment it didn’t clear my Cloudflare edge cache of my post, so people couldn’t see them.

A few days after fixing that, I was alerted to the fact that Cloudflare was caching the details of the last commenter on a post. This led me down a rather deep rabbit hole. I was reading code that I’d not seen in quite some time, in the WordPress comment system.

Now, this is all admittedly… A bit of the stuff that makes my kids call me a boomer. Because who does all this commenting on blogs? Right, not my kids. But still, a problem nonetheless.

This is rather lengthy, so here’s a table of contents:

## Table of contents

- [How the WordPress comment system works](#h-how-the-wordpress-comment-system-works)
- [The solution: moving comment cookies to JavaScript space](#h-the-solution-moving-comment-cookies-to-javascript-space)
    - [1. Set cookies when you comment](#h-1-set-cookies-when-you-comment)
    - [2. Preventing WordPress from setting comment cookies](#h-2-preventing-wordpress-from-setting-comment-cookies)
    - [3. Prevent WordPress from reading comment cookies](#h-3-prevent-wordpress-from-reading-comment-cookies)
    - [4. Fill the comment form with JavaScript](#h-4-fill-the-comment-form-with-javascript)
- [Aside: the SEO impact of the WordPress comment system](#h-aside-the-seo-impact-of-the-wordpress-comment-system)

## How the WordPress comment system works

When you leave a comment on a WordPress site, the process works as follows:

1. Your comment is submitted;
2. WordPress sets a cookie for each of your name, email address, and website URL;
3. Your comment is either held for moderation or immediately approved, based on several criteria. Then WordPress redirects you to a new URL and renders the post you commented on.

The URL it redirects you to can be two things:

- If your comment was immediately approved, it’s the URL you started on, with a `#comment-<comment-id>` anchor so that you’re shown your comment on the page immediately.
- If your comment was held for moderation, by default, WordPress sends you to the URL you started on with a `unapproved` URL parameter + a `moderation-hash` parameter. It uses these to show your *unapproved* comment rendered where it *would* be rendered. It adds a message around it that your comment is held for moderation.

When WordPress renders that page, and *every time after that* when it renders *any blog post* on the site for you, your browser sends your cookies to the server, and WordPress fills the data from those cookies into the comment form. So when that view, or a later view, is proxy cached (for instance by Cloudflare), your personal data gets cached along with it.

This is of course highly undesirable on sites that have aggressive caching. On sites like that, you want every page render to be as similar to another one as possible. Even more important you certainly don’t want Personally Identifiable Information in those rendered pages.

## The solution: moving comment cookies to JavaScript space

The solution to this is fairly obvious: there’s no reason why this would need to be done server side anymore, as we can do all of it in JavaScript. To do so, we have to take a few steps:

1. Set the appropriate cookies when you leave a comment (this is going to be in JavaScript);
2. Prevent WordPress from setting the comment cookies in the first place, as those might get cached;
3. Prevent WordPress from adding the content of those cookies to the rendered output on the page, as that would get it cached (this will be a few simple PHP functions);
4. Use JavaScript to read those cookies and fill the form fields.

We *could* do this in 3 steps if we chose not to be backwards compatible: if we chose different cookie names, we could skip step 3, but I like to keep things backwards compatible.

### 1. Set cookies when you comment

We’ll start by setting the comment cookies on form submission. This assumes that you’re using the default WordPress comment forms, and thus have the `commentform` `id` attribute on your comment forms.

We’ll update this code a bit later to add the functionality for step 4 as well. What this code does is fairly simple: it sets the 3 different comment cookies, with an expiry date of one year, when you submit the comment form. It sets them for `/` on your domain, so that they’re used on all the comment forms throughout a site.

```javascript
// Function to set comment cookies.
function setCommentCookies( name, email, url ) {
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    const expiryDate = new Date( Date.now() + oneYear ).toUTCString();

    // Set cookies for comment author data. This (slightly inefficient) cookie format is used for compatibility with core WordPress.
    document.cookie = `comment_author=${encodeURIComponent(name)}; expires=${expiryDate}; path=/`;
    document.cookie = `comment_author_email=${encodeURIComponent(email)}; expires=${expiryDate}; path=/`;
    document.cookie = `comment_author_url=${encodeURIComponent(url)}; expires=${expiryDate}; path=/`;
}

document.addEventListener( 'DOMContentLoaded', function () {
    const nameField  = document.getElementById( 'author' );
    const emailField = document.getElementById( 'email' );
    const urlField   = document.getElementById( 'url' );

    // Set cookies on form submission.
    const commentForm = document.getElementById( 'commentform' );
    if ( commentForm ) {
        commentForm.addEventListener( 'submit', function() {
            if ( nameField && emailField && urlField ) {
                setCommentCookies( nameField.value, emailField.value, urlField.value );
            }
        });
    }
})
```

### 2. Preventing WordPress from *setting* comment cookies

To prevent WordPress from setting comment cookies, we should just unhook [the function](https://github.com/WordPress/WordPress/blob/275d202ae3baac4e674538fd5bc3bc660825d0e0/wp-includes/comment.php#L530-L572) that sets these:

```php
remove_action( 'set_comment_cookies', 'wp_set_comment_cookies' );
```

### 3. Prevent WordPress from *reading* comment cookies

Next we want to prevent WordPress from adding the content from the comment cookies on the rendered pages. Since there is no way to prevent this functionality from running entirely, we just have to filter it to be empty:

```php
/**
 * To prevent this data from being cached, we don't want to show it server side.
 *
 * @param array $commenter Ignored.
 *
 * @return array With empty values for all three keys.
 */
function ignore_comment_cookies_serverside( $commenter ) {
    return [
        'comment_author'       => '',
        'comment_author_email' => '',
        'comment_author_url'   => '',
    ];
}

add_filter( 'wp_get_current_commenter', 'ignore_comment_cookies_serverside' );
```

### 4. Fill the comment form with JavaScript

To fill the comment form with JavaScript, we have to read the values from the cookies:

```javascript
// Function to read cookies.
function getCommentCookies() {
    const cookies = document.cookie.split( '; ' ).reduce(( acc, cookie ) => {
        const [key, value] = cookie.split( '=' );
        acc[key]           = decodeURIComponent(value);

        return acc;
    }, {} );

    return {
        name:  cookies['comment_author'] || '',
        email: cookies['comment_author_email'] || '',
        url:   cookies['comment_author_url'] || ''
    }
}
```

And now we update the `DOMContentLoaded` function we created in step 1 to add this:

```javascript
document.addEventListener( 'DOMContentLoaded', function () {
    const nameField  = document.getElementById( 'author' );
    const emailField = document.getElementById( 'email' );
    const urlField   = document.getElementById( 'url' );

    // Get the data from the comments.
    const cookies = getCommentCookies();

    // Populate comment form fields with cookie data.
    if (nameField)  nameField.value  = cookies.name;
    if (emailField) emailField.value = cookies.email;
    if (urlField)   urlField.value   = cookies.url;

    // Set cookies on form submission.
    const commentForm = document.getElementById( 'commentform' );
    if ( commentForm ) {
        commentForm.addEventListener( 'submit', function() {
            if ( nameField && emailField && urlField ) {
                setCommentCookies( nameField.value, emailField.value, urlField.value );
            }
        });
    }
})
```

I have combined all of these in [this gist](https://gist.github.com/jdevalk/2d4d4f6d055ceede40a68eeb21800ef4), for easy copy pasting.

## Aside: the SEO impact of the WordPress comment system

The fact that WordPress redirects to a URL with an `unapproved` parameter is *incredibly* tricky in my eyes; I’m never a fan of URL parameters being added anywhere (as it usually busts the cache, and bloats the URL space), but here it also leads to potential SEO issues if people link to these parameterized URLs. I was able to find quite a few of these with [relatively simple Google search](https://www.google.com/search?q=inurl:unapproved+inurl:moderation-hash):

- [https://poty-demolition.fr/bonjour-tout-le-monde/?unapproved=24737&moderation-hash=91fb997849f7f870c5abd153fb99a326](https://poty-demolition.fr/bonjour-tout-le-monde/?unapproved=24737&moderation-hash=91fb997849f7f870c5abd153fb99a326)
- [https://sekainoowari.jp/discography/2011/08/17/125/inori/?unapproved=11&moderation-hash=9a1bc2e1de3f9708df8a394c836bcc76](https://sekainoowari.jp/discography/2011/08/17/125/inori/?unapproved=11&moderation-hash=9a1bc2e1de3f9708df8a394c836bcc76)

Since WordPress does not `noindex` these URLs by default, this is a perfectly sensible way of injecting links into a page and getting (usually `nofollow`, but still) links from domains that have no idea they’re linking to you, thinking they’ve not approved your comment.

SEO plugins should take note and add `noindex` to every page that has these URL parameters on it, something I think WordPress core should do too. On my site, I have decided to just not let WordPress redirect to this parameterized URL entirely, something I have included in the gist as well.
