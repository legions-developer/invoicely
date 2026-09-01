# Invoicely CLI

The Bun CLI validates invoice JSON, manages private named templates in local PostgreSQL, reserves serial numbers, and renders the same PDF templates as the web app.

Run it from the repository root:

```bash
bun run invoice help
```

## Local setup and privacy

Start PostgreSQL and apply both the committed web migrations and the current development schema:

```bash
bun run db:up
bun run db:migrate
bun run db:push
```

The `local_invoice_templates` table stores sender details, payment information, theme settings, and the next serial number. Template data is not committed to Git. Keep personal template JSON outside this repository, for example under a private configuration directory.

Template commands reject a non-loopback `DATABASE_URL` by default. Set `INVOICELY_ALLOW_REMOTE_TEMPLATES=true` only when you deliberately want to store these private templates in a remote database. The web app and its hosted PostgreSQL connection do not otherwise depend on the CLI template table.

The committed files in `test/fixtures` contain synthetic data only. They are examples and automated test inputs, not user templates.

## Template commands

Validate a template before storing it:

```bash
bun run invoice validate template --file apps/cli/test/fixtures/example-template.json --json
```

Save and inspect a named template:

```bash
bun run invoice template save --file /private/path/my-template.json
bun run invoice template list
bun run invoice template show my-template --json
```

Saving refuses to replace an existing name unless `--force` is supplied. `template show --json` intentionally prints the full private template, while `template list --json` returns summaries only.

Manage its serial sequence:

```bash
bun run invoice serial peek my-template --json
bun run invoice serial set my-template 0100 --json
bun run invoice serial next my-template --json
```

`serial next` transactionally returns the current value and advances the stored value. Leading zeroes are preserved.

## Generate a PDF

Generation input contains client details, line items, explicit invoice/due dates, and optional invoice overrides. See `test/fixtures/example-input.json` for the JSON shape.

```bash
bun run invoice generate \
  --template my-template \
  --input /private/path/invoice-input.json \
  --output /private/path/invoice.pdf \
  --json
```

Without `--serial`, generation reserves the template serial transactionally before rendering. A rendering or filesystem failure can therefore leave a safe gap, but concurrent runs cannot reuse a number. Pass `--serial 0123` to use an explicit number without advancing the stored sequence.

Output files are not replaced unless `--force` is supplied. Successful JSON output includes the invoice number, exact Decimal-backed totals, absolute PDF path, and SHA-256 checksum.

## Validation and automation

```bash
bun run invoice validate invoice --file /private/path/full-invoice.json --json
bun run invoice validate input --file /private/path/invoice-input.json --json
bun run invoice validate template --file /private/path/template.json --json
```

All commands accept `--json`. JSON results go to stdout; JSON errors go to stderr.

| Exit code | Meaning                                            |
| --------- | -------------------------------------------------- |
| `0`       | Success                                            |
| `2`       | Invalid command or arguments                       |
| `3`       | Schema validation failed                           |
| `4`       | Template not found                                 |
| `5`       | I/O, database, privacy guard, or rendering failure |

Run the CLI and shared-domain tests with `bun run test`, or build the bundled Bun entry point with `bun run build` from the repository root.
