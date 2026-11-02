FROM nginx:alpine

# Remove default nginx configuration
RUN rm -f /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Create log directory
RUN mkdir -p /var/log/nginx

# Expose port
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
