/**
 * Class representing a car with seats and a driver.
 * Seats are stored as a Map<index, Person|undefined> so lookups are O(1)
 * and there are never accidental duplicate entries for the same index.
 * Index 0 is always the driver.
 */
class Car {
  /**
   * @param {Person} driver - The driver of the car
   * @param {number} seatCapacity - Total number of seats including driver
   */
  constructor(driver, seatCapacity) {
    this.driver = driver
    this.seatCapacity = seatCapacity
    this.seatsTaken = 1 // driver always counts

    // Map<index, Person|undefined>
    // Index 0 = driver, 1..seatCapacity-1 = passenger slots (undefined = empty)
    this.seats = new Map()
    this.seats.set(0, driver)
    for (let i = 1; i < seatCapacity; i++) {
      this.seats.set(i, undefined)
    }
  }

  /**
   * Add a person to the next available passenger seat.
   * Silently ignores if the person is already in this car (prevents duplicates).
   * @param {Person} person
   * @throws {Error} if car is full
   */
  addPerson(person) {
    // Duplicate guard: bail if this person is already seated
    for (const [, occupant] of this.seats) {
      if (occupant?.email === person.email) return
    }

    for (let i = 1; i < this.seatCapacity; i++) {
      if (this.seats.get(i) === undefined) {
        this.seats.set(i, person)
        this.seatsTaken += 1
        return
      }
    }
    throw new Error('Cannot add person: car is full')
  }

  /**
   * Remove a person by seat index.
   * @param {number} index - 0 is driver (cannot remove), 1+ are passengers
   * @returns {Person | null}
   */
  removePersonByIndex(index) {
    if (index === 0) return null // cannot remove driver
    const person = this.seats.get(index)
    if (!person) return null
    this.seats.set(index, undefined)
    this.seatsTaken -= 1
    return person
  }

  /**
   * Returns the number of open passenger seats.
   */
  getAvailableSeats() {
    return this.seatCapacity - this.seatsTaken
  }
}

export { Car }