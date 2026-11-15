
name: Deploy ORQAVEN Edge Function

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'
      - '.github/workflows/deploy-supabase.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Function
        run: supabase functions deploy orqaven-email --project-ref "$PROJECT_REF"
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
