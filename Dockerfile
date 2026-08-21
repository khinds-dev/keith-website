FROM nginx:alpine

# Remove the default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files
COPY index.html /usr/share/nginx/html/index.html
COPY websites.html /usr/share/nginx/html/websites.html
COPY contact.html /usr/share/nginx/html/contact.html
COPY profile.jpg /usr/share/nginx/html/profile.jpg

EXPOSE 80
