// Import book data
import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

// Book class
class Book {
  constructor({ id, title, author, genres, image, description, published }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.genres = genres;
    this.image = image;
    this.description = description;
    this.published = published;
  }
}

// Library class
class Library {
  constructor(books, authors, genres) {
    this.books = books.map(book => new Book(book));
    this.authors = authors;
    this.genres = genres;
    this.matches = this.books;
    this.page = 1;
  }

  filterBooks(filters) {
    return this.books.filter(book => {
      const titleMatch = filters.title.trim() === "" || book.title.toLowerCase().includes(filters.title.toLowerCase());
      const authorMatch = filters.author === "any" || book.author === filters.author;
      const genreMatch = filters.genre === "any" || book.genres.includes(filters.genre);
      return titleMatch && authorMatch && genreMatch;
    });
  }
}

// DOM Manipulation functions
const getElement = selector => document.querySelector(selector);

const createBookPreviews = (books, container) => {
  const fragment = document.createDocumentFragment();
  books.forEach(({ author, id, image, title }) => {
    const element = document.createElement("button");
    element.classList = "preview";
    element.dataset.preview = id;
    element.innerHTML = `
      <img class="preview__image" src="${image}" />
      <div class="preview__info">
        <h3 class="preview__title">${title}</h3>
        <div class="preview__author">${library.authors[author]}</div>
      </div>
    `;
    fragment.appendChild(element);
  });
  container.appendChild(fragment);
};

const createOptions = (options, defaultOption, container) => {
  const fragment = document.createDocumentFragment();
  const firstOption = document.createElement("option");
  firstOption.value = "any";
  firstOption.innerText = defaultOption;
  fragment.appendChild(firstOption);
  Object.entries(options).forEach(([id, name]) => {
    const element = document.createElement("option");
    element.value = id;
    element.innerText = name;
    fragment.appendChild(element);
  });
  container.appendChild(fragment);
};

// Theme Manager
class ThemeManager {
  static applyTheme(theme) {
    const isNight = theme === "night";
    document.documentElement.style.setProperty("--color-dark", isNight ? "255, 255, 255" : "10, 10, 20");
    document.documentElement.style.setProperty("--color-light", isNight ? "10, 10, 20" : "255, 255, 255");
    localStorage.setItem("theme", theme);
  }

  static getStoredTheme() {
    return localStorage.getItem("theme") || "day";
  }
}

// "Show more" button logic
const updateShowMoreButton = () => {
  const remainingBooks = library.matches.length - library.page * BOOKS_PER_PAGE;
  const button = getElement("[data-list-button]");
  button.innerText = `Show more (${remainingBooks})`;
  button.disabled = remainingBooks <= 0;
  button.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining">(${remainingBooks > 0 ? remainingBooks : 0})</span>
  `;
};

// Initialize Library
const library = new Library(books, authors, genres);

// Event listener functions
const closeOverlay = selector => getElement(selector).open = false;
const openOverlay = (selector, focusSelector = null) => {
  getElement(selector).open = true;
  if (focusSelector) getElement(focusSelector).focus();
};

// Initial setup
createOptions(genres, "All Genres", getElement("[data-search-genres]"));
createOptions(authors, "All Authors", getElement("[data-search-authors]"));
const initialTheme = ThemeManager.getStoredTheme();
ThemeManager.applyTheme(initialTheme);
createBookPreviews(library.matches.slice(0, BOOKS_PER_PAGE), getElement("[data-list-items]"));
updateShowMoreButton();

// Event Listeners
getElement("[data-search-cancel]").addEventListener("click", () => closeOverlay("[data-search-overlay]"));
getElement("[data-settings-cancel]").addEventListener("click", () => closeOverlay("[data-settings-overlay]"));
getElement("[data-header-search]").addEventListener("click", () => openOverlay("[data-search-overlay]", "[data-search-title]"));
getElement("[data-header-settings]").addEventListener("click", () => openOverlay("[data-settings-overlay]"));
getElement("[data-list-close]").addEventListener("click", () => closeOverlay("[data-list-active]"));

getElement("[data-settings-form]").addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const { theme } = Object.fromEntries(formData);
  ThemeManager.applyTheme(theme);
  closeOverlay("[data-settings-overlay]");
});

getElement("[data-search-form]").addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const filters = Object.fromEntries(formData);
  library.matches = library.filterBooks(filters);
  library.page = 1;
  getElement("[data-list-message]").classList.toggle("list__message_show", library.matches.length < 1);
  getElement("[data-list-items]").innerHTML = "";
  createBookPreviews(library.matches.slice(0, BOOKS_PER_PAGE), getElement("[data-list-items]"));
  updateShowMoreButton();
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeOverlay("[data-search-overlay]");
});

getElement("[data-list-button]").addEventListener("click", () => {
  createBookPreviews(library.matches.slice(library.page * BOOKS_PER_PAGE, (library.page + 1) * BOOKS_PER_PAGE), getElement("[data-list-items]"));
  library.page += 1;
  updateShowMoreButton();
});

getElement("[data-list-items]").addEventListener("click", event => {
  const pathArray = Array.from(event.composedPath());
  const active = pathArray.find(node => node?.dataset?.preview);
  if (active) {
    const book = library.books.find(book => book.id === active.dataset.preview);
    if (book) {
      getElement("[data-list-active]").open = true;
      getElement("[data-list-blur]").src = book.image;
      getElement("[data-list-image]").src = book.image;
      getElement("[data-list-title]").innerText = book.title;
      getElement("[data-list-subtitle]").innerText = `${library.authors[book.author]} (${new Date(book.published).getFullYear()})`;
      getElement("[data-list-description]").innerText = book.description;
    }
  }
});
