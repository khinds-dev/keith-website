// Injects the current date and time into Bob's context before every prompt.
// Output goes to stdout → added to model context by the UserPromptSubmit hook.
const now = new Date();
const formatted = now.toLocaleString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});
process.stdout.write(`Current date and time: ${formatted}\n`);
