FROM nginx:alpine

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files
COPY index.html /usr/share/nginx/html/index.html
COPY profile.jpg /usr/share/nginx/html/profile.jpg
COPY 404.html /usr/share/nginx/html/404.html
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml

# Copy shared assets
COPY css/shared.css /usr/share/nginx/html/css/shared.css
COPY js/nav.js /usr/share/nginx/html/js/nav.js

# Copy page directories (clean URLs: /portfolio, /contact, /blog, /blog/post, /admin)
COPY portfolio/index.html /usr/share/nginx/html/portfolio/index.html
COPY contact/index.html /usr/share/nginx/html/contact/index.html
COPY repos/index.html /usr/share/nginx/html/repos/index.html
COPY blog/index.html /usr/share/nginx/html/blog/index.html
COPY blog/post/index.html /usr/share/nginx/html/blog/post/index.html
COPY admin/index.html /usr/share/nginx/html/admin/index.html

EXPOSE 80
