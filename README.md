# Language Learning Demo

This repo demonstrates how you can use Temporal, Translation, and AI services to help you build your vocabulary deck for language learning.

## Prerequisite

You will need the following before getting started:
- [Anki Desktop App](https://apps.ankiweb.net/)
- [Temporal](https://temporal.io/)
- [Temporal CLI](https://docs.temporal.io/cli)

Optionally you can also add the following translation / ai services:
- [Anthropic](https://www.anthropic.com/)
- [OpenAI](https://platform.openai.com/api-keys)
- [Google Translate](https://cloud.google.com/translate/docs/setup)
- [Azure Text Translation](https://learn.microsoft.com/en-us/azure/ai-services/translator/?WT.mc_id=Portal-Microsoft_Azure_ProjectOxford)

## Running the Demo locally

```bash
temporal server start-dev
```

Set the following environment variables to use the translation / ai services:
```sh
export GOOGLE_CLOUD_API_KEY=
export ANTHROPIC_API_KEY=
export OPENAI_API_KEY=
export OPENAI_ORGANIZATION=
export AZURE_API_KEY=
export AZURE_REGION=
export AZURE_ENDPOINT=
```

By default the *From Language* is set to English. To override this and to set the To Language, set the following environment variables:

```bash
export TO_LANGUAGE=
export FROM_LANGUAGE=
```

See a list of supported languages in the `apps/web/static/languages.json`

### Start worker and UI

Run the following command:

```bash
npm install
npm run dev
```

Navigate to http://localhost:5173 in a web browser to interact with the UX

Set the following environment variables to use Temporal Cloud ☁️.
```sh
export TEMPORAL_ADDRESS=<namespace>.<accountId>.tmprl.cloud
export TEMPORAL_NAMESPACE=<namespace>.<accountId>
export TEMPORAL_CLIENT_CERT_PATH="/path/to/cert.pem"
export TEMPORAL_CLIENT_KEY_PATH="/path/to/key.key"
export TEMPORAL_TASK_QUEUE=language
```