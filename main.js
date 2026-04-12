function createLink(entry, className) {
  const link = document.createElement("a");
  link.className = className;
  link.href = entry.href;
  link.textContent = entry.label;

  if (entry.href.startsWith("http")) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }

  if (entry.download) {
    link.setAttribute("download", "");
  }

  return link;
}

function renderHero(hero) {
  const figure = document.getElementById("hero-figure");
  document.getElementById("hero-location").textContent = hero.location;
  document.getElementById("hero-name").textContent = hero.name;
  document.getElementById("hero-headline").textContent = hero.headline;
  document.getElementById("hero-summary").textContent = hero.summary;

  const links = document.getElementById("hero-links");
  links.replaceChildren();
  hero.links.forEach((entry) => {
    links.append(createLink(entry, "hero-link"));
  });

  figure.replaceChildren();
  if (!hero.portrait?.src) {
    figure.hidden = true;
    return;
  }

  const image = document.createElement("img");
  image.className = "hero-portrait";
  image.src = hero.portrait.src;
  image.alt = hero.portrait.alt;
  image.width = hero.portrait.width;
  image.height = hero.portrait.height;
  image.decoding = "async";
  image.fetchPriority = "high";

  figure.append(image);
  figure.hidden = false;
}

function renderScope(scope) {
  const list = document.getElementById("scope-list");
  list.replaceChildren();

  scope.facts.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "scope-item";

    const label = document.createElement("span");
    label.className = "scope-label";
    label.textContent = entry.label;

    const text = document.createElement("p");
    text.className = "scope-text";
    text.textContent = entry.text;

    item.append(label, text);
    list.append(item);
  });
}

function renderExperience(experience) {
  const list = document.getElementById("experience-list");
  list.replaceChildren();

  experience.entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "entry";

    const top = document.createElement("div");
    top.className = "entry-top";

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = entry.title;

    const dates = document.createElement("p");
    dates.className = "entry-dates";
    dates.textContent = entry.dates;

    top.append(title, dates);

    const organization = document.createElement("p");
    organization.className = "entry-organization";
    organization.textContent = entry.organization;

    const summary = document.createElement("p");
    summary.className = "entry-summary";
    summary.textContent = entry.summary;

    const bullets = document.createElement("ul");
    bullets.className = "entry-bullets";

    entry.bullets.forEach((bullet) => {
      const item = document.createElement("li");
      item.textContent = bullet;
      bullets.append(item);
    });

    article.append(top, organization, summary, bullets);
    list.append(article);
  });
}

function renderSelectedWork(selectedWork) {
  const list = document.getElementById("work-list");
  list.replaceChildren();

  selectedWork.entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "work-item";

    const title = document.createElement("h3");
    title.className = "work-title";
    title.textContent = entry.title;

    const detailList = document.createElement("dl");
    detailList.className = "work-details";

    [
      ["Context", entry.context],
      ["Scope", entry.scope],
      ["Result", entry.result]
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "work-row";

      const term = document.createElement("dt");
      term.className = "work-term";
      term.textContent = label;

      const description = document.createElement("dd");
      description.className = "work-description";
      description.textContent = value;

      row.append(term, description);
      detailList.append(row);
    });

    article.append(title, detailList);
    list.append(article);
  });
}

function renderBackground(background) {
  const list = document.getElementById("background-list");
  const educationList = document.getElementById("education-list");
  list.replaceChildren();
  educationList.replaceChildren();

  background.entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "background-item";

    const top = document.createElement("div");
    top.className = "background-top";

    const title = document.createElement("h3");
    title.className = "background-title";
    title.textContent = entry.title;

    const dates = document.createElement("p");
    dates.className = "background-dates";
    dates.textContent = entry.dates;

    top.append(title, dates);

    const organization = document.createElement("p");
    organization.className = "background-organization";
    organization.textContent = entry.organization;

    const summary = document.createElement("p");
    summary.className = "background-summary";
    summary.textContent = entry.summary;

    article.append(top, organization, summary);
    list.append(article);
  });

  background.education.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "education-item";

    const degree = document.createElement("p");
    degree.className = "education-degree";
    degree.textContent = entry.degree;

    const organization = document.createElement("p");
    organization.className = "education-organization";
    organization.textContent = entry.organization;

    const dates = document.createElement("p");
    dates.className = "education-dates";
    dates.textContent = entry.dates;

    item.append(degree, organization, dates);
    educationList.append(item);
  });
}

function renderContact(contact) {
  document.getElementById("contact-intro").textContent = contact.intro;

  const links = document.getElementById("contact-links");
  links.replaceChildren();
  const secondary = document.createElement("div");
  secondary.className = "contact-links-secondary";

  contact.links.forEach((entry, index) => {
    const link = createLink(
      entry,
      index === 0 ? "contact-link contact-link-primary" : "contact-link"
    );

    if (entry.text) {
      link.textContent = entry.text;
      link.setAttribute("aria-label", `${entry.label}: ${entry.text}`);
    }

    if (index === 0) {
      links.append(link);
      return;
    }

    secondary.append(link);
  });

  if (secondary.childNodes.length > 0) {
    links.append(secondary);
  }
}

function renderFooter(footer) {
  document.getElementById("footer-note").textContent = footer.disclaimer;
}

function renderSite() {
  const { hero, scope, experience, selectedWork, background, contact, footer } =
    window.siteContent;

  renderHero(hero);
  renderScope(scope);
  renderExperience(experience);
  renderSelectedWork(selectedWork);
  renderBackground(background);
  renderContact(contact);
  renderFooter(footer);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderSite);
} else {
  renderSite();
}
