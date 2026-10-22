---
sidebar_position: 1.5
title: iOS Shortcut
description: Import a recipe from the iOS share sheet with a Shortcut and the Norish API.
---

# iOS Shortcut

A Shortcut can send any page you share on iPhone or iPad straight to Norish.
It calls [`POST /api/v1/recipes/import/url`](./api.mdx) with an API key.

:::info Shortcuts made before 0.20

Since 0.20 the endpoint answers with an object, not a bare recipe id, and an
already-imported recipe is a success rather than a `409`. A Shortcut built
against the old answer stops at the step that reads it. Rebuild that step as
described below.

:::

## 1. Create an API key

In Norish, open **Settings → User → API Keys**, create a key and copy it. It is
shown once.

## 2. Build the Shortcut

In the Shortcuts app, create a new Shortcut and add these actions:

1. **Receive** _URLs_ and _Safari web pages_ **input from** _Share Sheet_.
2. **Get Contents of URL**
   - URL: `https://<your-norish-host>/api/v1/recipes/import/url`, using the
     address in your `AUTH_URL`.
   - Method: `POST`
   - Headers: `x-api-key` = _your API key_
   - Request Body: _JSON_, with one text field `url` = _Shortcut Input_
3. **Get Dictionary Value** for key `status` in _Contents of URL_.
4. **If** _Dictionary Value_ **is** `exists`:
   - **Show Notification** "Already in Norish".
   - **Otherwise**: **Show Notification** "Importing into Norish…".

The answer looks like this:

```json
{ "recipeId": "3f1c…", "status": "queued" }
```

`queued` means the import has started and the recipe appears in Norish when
it finishes. `exists` carries the id of the recipe you already have, so a
Shortcut can open `https://<your-norish-host>/recipes/<recipeId>` instead.

## When it fails

| Answer                   | Meaning                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `401`                    | The API key is missing or wrong.                                           |
| `400`                    | The shared item is not a web address. Share the page, not its text.        |
| `409`                    | An import of that address is already running.                              |
| `412`                    | A video link (YouTube, Instagram, …) while AI or video parsing is off.     |
| A redirect or login page | The host is not your `AUTH_URL`, or a proxy in front of Norish rewrote it. |
