sudo docker stop spacetoon-pocket
sudo docker rm spacetoon-pocket
sudo docker run -d \
  --name spacetoon-pocket \
  --restart always \
  -p 3000:3000 \
  -e "NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMG1CPnkUkQtz83GbO5SYibGOGi49DC8MVBMBM1W_dBoTc0yhyCwceFWC4BJRNaQjnjzSND5OYZAgn4iXaIe2x8" \
  -e "COOKIE_SECURE=true" \
  -e "DATABASE_URL=postgresql://spacetoon_admin:Spacetoon2026Secure!@spacetoon-pocket-db.czwk2aaa2pxe.eu-central-1.rds.amazonaws.com:5432/spacetoon_pocket?sslmode=require" \
  -e "DIRECT_URL=postgresql://spacetoon_admin:Spacetoon2026Secure!@spacetoon-pocket-db.czwk2aaa2pxe.eu-central-1.rds.amazonaws.com:5432/spacetoon_pocket?sslmode=require" \
  -e "JWT_SECRET=spacetoon_pocket_super_secret_jwt_key_2026" \
  -e "VAPID_PRIVATE_KEY=7ZHyJlyNJfcCshGFCpGVsFgTXF6FbDto27bDgXSzR-s" \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  932705495654.dkr.ecr.eu-central-1.amazonaws.com/spacetoon-pocket:latest
