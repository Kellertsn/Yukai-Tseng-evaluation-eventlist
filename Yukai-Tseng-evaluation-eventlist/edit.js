const eventsAPI = (function () {
  const API_URL = "http://localhost:3000/events";

  async function getEvents() {
    return fetch(API_URL).then((res) => res.json());
  }

  async function addEvent(newEvent) {
    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    }).then((res) => res.json());
  }

  async function deleteEvent(id) {
    return fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  }

  async function updateEvent(id, updatedEvent) {
    return fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedEvent),
    }).then((res) => res.json());
  }

  return { getEvents, addEvent, deleteEvent, updateEvent };
})();

class EventsView {
  constructor() {
    this.eventList = document.querySelector(".event__list");
    this.addBtn = document.querySelector(".event__add-btn");
  }

  clearNewForm(button) {
    if (button) {
      const row = button.closest("tr");
      if (row && row.classList.contains("event__form")) {
        row.remove();
        return;
      }
    }

    const form = this.eventList.querySelector(".event__form");
    if (form) form.remove();
  }

  renderEvents(events) {
    this.eventList.innerHTML = "";
    events.forEach((event) => {
      this.renderNewEvent(event);
    });
  }

  removeEventElem(id) {
    document.getElementById(id).remove();
  }

  renderNewEvent(newEvent) {
    this.eventList.appendChild(this.createEventElement(newEvent));
  }

  createEventElement(event) {
    const tr = document.createElement("tr");
    tr.setAttribute("id", event.id);
    tr.innerHTML = `<td>${event.name}</td>
      <td>${event.start}</td>
      <td>${event.end}</td>
      <td>
        <button class="event__edit-btn">✎</button>
        <button class="event__delete-btn">🗑</button>
      </td>`;
    return tr;
  }

  renderNewForm() {
    const tr = document.createElement("tr");
    tr.classList.add("event__form");
    tr.innerHTML = `<td><input class="event__input-name" placeholder="Event name" /></td>
      <td><input type="date" class="event__input-start" /></td>
      <td><input type="date" class="event__input-end" /></td>
      <td>
        <button class="event__submit-btn">+</button>
        <button class="event__cancel-btn">-</button>
      </td>`;
    this.eventList.appendChild(tr);
  }

  switchToEditMode(row) {
    const name = row.children[0].textContent;
    const start = row.children[1].textContent;
    const end = row.children[2].textContent;

    row.innerHTML = `
    <td><input class="event__input-name" value="${name}" /></td>
    <td><input type="date" class="event__input-start" value="${start}" /></td>
    <td><input type="date" class="event__input-end" value="${end}" /></td>
    <td>
      <button class="event__save-btn">S</button>
      <button class="event__cancel-edit-btn">-</button>
    </td>
  `;
  }

  updateEventRow(row, event) {
    row.innerHTML = `
    <td>${event.name}</td>
    <td>${event.start}</td>
    <td>${event.end}</td>
    <td>
      <button class="event__edit-btn">✎</button>
      <button class="event__delete-btn">🗑</button>
    </td>
  `;
  }
}

class EventsModel {
  #events;
  constructor(events = []) {
    this.#events = events;
  }

  setEvents(events) {
    this.#events = events;
  }

  getEvents() {
    return this.#events;
  }

  addEvent(newEvent) {
    this.#events.push(newEvent);
  }

  deleteEvent(id) {
    this.#events = this.#events.filter((ev) => ev.id !== id);
  }

  updateEvent(id, updated) {
    this.#events = this.#events.map((ev) =>
      ev.id === id ? { ...ev, ...updated } : ev
    );
  }
}

class EventsController {
  constructor(view, model) {
    this.view = view;
    this.model = model;
    this.init();
  }

  init() {
    this.setUpEvents();
    this.fetchEvents();
  }

  setUpEvents() {
    this.setUpSubmitEvent();
    this.setUpDeleteEvent();
    this.setUpEditEvent();
  }

  async fetchEvents() {
    const events = await eventsAPI.getEvents();
    this.model.setEvents(events);
    this.view.renderEvents(events);
  }

  setUpDeleteEvent() {
    this.view.eventList.addEventListener("click", async (e) => {
      const target = e.target;
      if (!target.classList.contains("event__delete-btn")) return;

      const row = target.closest("tr");
      const id = row.id;

      await eventsAPI.deleteEvent(id);
      this.model.deleteEvent(id);
      this.view.removeEventElem(id);
    });
  }

  setUpSubmitEvent() {
    this.view.addBtn.addEventListener("click", () => {
      this.view.renderNewForm();
    });

    this.view.eventList.addEventListener("click", async (e) => {
      const target = e.target;

      if (!target.classList.contains("event__submit-btn")) return;

      const row = target.closest("tr");
      const name = row.querySelector(".event__input-name").value;
      const start = row.querySelector(".event__input-start").value;
      const end = row.querySelector(".event__input-end").value;

      if (!name || !start || !end) {
        alert("Input Not Valid!");
        return;
      }

      const newEvent = { name, start, end };

      const saved = await eventsAPI.addEvent(newEvent);
      this.model.addEvent(saved);
      this.view.renderNewEvent(saved);
      this.view.clearNewForm();
    });

    this.view.eventList.addEventListener("click", (e) => {
      const target = e.target;
      if (target.classList.contains("event__cancel-btn")) {
        this.view.clearNewForm(target);
      }
    });
  }

  setUpEditEvent() {
    this.view.eventList.addEventListener("click", async (e) => {
      const target = e.target;

      if (target.classList.contains("event__edit-btn")) {
        const row = target.closest("tr");
        this.view.switchToEditMode(row);
      }

      if (target.classList.contains("event__save-btn")) {
        const row = target.closest("tr");
        const id = row.id;
        const name = row.querySelector(".event__input-name").value;
        const start = row.querySelector(".event__input-start").value;
        const end = row.querySelector(".event__input-end").value;

        if (!name || !start || !end) {
          alert("All fields are required");
          return;
        }

        const updatedEvent = { name, start, end };

        const saved = await eventsAPI.updateEvent(id, updatedEvent);
        this.model.updateEvent(id, saved);
        this.view.updateEventRow(row, saved);
      }

      if (target.classList.contains("event__cancel-edit-btn")) {
        const row = target.closest("tr");
        const id = parseInt(row.id);
        const event = this.model.getEvents().find((ev) => ev.id === id);
        this.view.updateEventRow(row, event);
      }
    });
  }
}

const eventsView = new EventsView();
const eventsModel = new EventsModel();
const eventsController = new EventsController(eventsView, eventsModel);
