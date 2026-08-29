# Admin guide

Admin capabilities include pending-listing review with approve/reject decisions and audit events. The admin UI is at `/admin`; backend authorization checks the account role for every admin endpoint.

When released, admin users must use individually assigned accounts; shared credentials and claims of verification without evidence are prohibited.

## Local first administrator

Create an account through the registration screen, then promote it only in local development:

```powershell
docker compose exec postgres psql -U dreamcar -d dream_car_bazaar -c "UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';"
```

Log out and sign in again to obtain an admin token. In production, create the first administrator through a controlled deployment procedure—not by exposing a public promotion endpoint.
