// Picks an option in a Lexta dropdown (packages/ui Select) the way a person does: opens the combobox named `label`
// and clicks the option in the branded list. On touch screens the dropdown keeps the phone's own picker (no combobox
// is laid over the select), so there it chooses on the select itself.
//   await choose(page, "Brand", "Yazz")                 by the option's text
//   await choose(page, "Status", { value: "submitted" }) by the option's value
//   await choose(form, "Region", "Volta", { exact: false })
// `scope` is a Page or a Locator (the combobox is looked for inside it; the list is looked for on the page, since it
// opens at the end of the page).
export async function choose(scope, label, option, { exact = true } = {}) {
  const page = typeof scope.page === "function" ? scope.page() : scope;
  // Enhanced, the real select is hidden from screen readers, so the only combobox by that name is the Lexta one. On a
  // touch screen (or before the page runs) the select itself is the combobox (a select's own role).
  const combo = scope.getByRole("combobox", { name: label, exact });
  if (await combo.evaluate((el) => el instanceof HTMLSelectElement)) {
    await combo.selectOption(typeof option === "string" ? { label: option } : option);
    return;
  }
  let text = typeof option === "string" ? option : option.label;
  if (!text) {
    const select = combo.locator("xpath=..").locator("select");
    text = await select.evaluate((s, v) => [...s.options].find((o) => o.value === v)?.text.replace(/\s+/g, " ").trim() ?? "", option.value);
    if (!text) throw new Error(`no option with the value ${option.value} in ${label}`);
  }
  await combo.click();
  const list = page.locator(`[role=listbox]#${await combo.getAttribute("aria-controls")}`);
  await list.waitFor();
  await list.getByRole("option", { name: text, exact: true }).click();
  await list.waitFor({ state: "detached" });
}
