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
    return fetch(`${API_URL}/${id}`, { method: "DELETE" }).then((res) =>
      res.json()
    );
  }

  return { getEvents, addEvent, deleteEvent };
})();

class EventsView {
  constructor() {
    this.newEventForm = document.querySelector(".event__form");
    this.eventList = document.querySelector(".event__list");
    this.addBtn = document.querySelector(".event__add-btn");
  }

  clearNewForm() {
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
    tr.innerHTML = 
      `<td>${event.name}</td>
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
    tr.innerHTML = 
      `<td><input class="event__input-name" placeholder="Event name" /></td>
      <td><input type="date" class="event__input-start" /></td>
      <td><input type="date" class="event__input-end" /></td>
      <td>
        <button class="event__submit-btn">+</button>
        <button class="event__cancel-btn">-</button>
      </td>`;
    this.eventList.appendChild(tr);
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
      const id = row?.id;
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
        this.view.clearNewForm();
      }
    });
  }
}

const eventsView = new EventsView();
const eventsModel = new EventsModel();
const eventsController = new EventsController(eventsView, eventsModel);
