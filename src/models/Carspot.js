/**
 * Class representing a car spot in a car.
 * A car spot can hold one or more people and tracks the number of seats they occupy.
 */
class Carspot {

   /**
    * Create a CarSpot.
    * @param {...Person} persons - One or more Person objects occupying this spot.
    */
   constructor(...persons) {
      /** @type {Person[]} Array of people in this car spot */
      this.persons = persons

      /** @type {number} Total number of seats currently taken in this spot */
      this.seatsTaken = this.persons.length
   }

   /**
   * Add a person to this car spot.
   * Updates the seatsTaken count automatically.
   * @param {Person} person - The person to add to the car spot
   */
   addPerson(person) {
      this.persons.push(person)

      // Update total seats taken
      this.seatsTaken = this.persons.length
   }
}

export { Carspot };