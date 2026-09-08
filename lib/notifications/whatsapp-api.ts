// This file is intentionally unused.
//
// Met Scents uses WhatsApp click-to-chat only (see lib/notifications/whatsapp.ts):
// every "Send on WhatsApp" button opens the customer's own WhatsApp app with the
// message pre-filled, and they press send themselves. There is no WhatsApp
// Business API / Cloud API integration, no access token, and no webhook — by
// design, per the product decision to keep WhatsApp delivery fully manual and
// free of third-party API setup.
//
// This file is kept as an empty placeholder (rather than deleted) only because
// the deployment environment doesn't allow removing files from this folder.
// Nothing in the app imports from it.
export {};
