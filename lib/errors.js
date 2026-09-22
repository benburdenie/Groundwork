// Thrown for anything the caller got wrong (bad input, missing record). The
// message is written to be shown to the user, so it never contains database
// details. Kept in its own file, free of any Next.js import, so it (and
// anything built on it, like lib/jobDates.js) can be exercised directly by
// plain `node --test` as well as inside API routes.
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
