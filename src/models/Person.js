/**
 * Class representing a person participating in a ride.
 * Stores the person's name, location, and earliest available departure time.
 */
class Person {

   /**
    * Create a Person.
    * @param {string} name - Full name of the person.
    * @param {[number, number]} geolocation - Latitude and longitude coordinates as an array of floats.
    */
   constructor(name, email, address, driverStatus = false, geolocation = null) {
      /** @type {string} Name of the person */
      this.name = name

      this.email = email
      /** @type {string} Address location */
      this.address = address
      /** @type {boolean} If person is a driver */
      this.driverStatus = driverStatus

      /** @type {[number, number]} Latitude and longitude coordinates */
      this.geolocation = geolocation

   }


   /**
   * Format the person's info as a string.
   * @returns {string} Description of the person
   */
  toString() {
    return `${this.name} (Location: [${this.geolocation.join(", ")}], Earliest Leave: ${this.earliestTime.toISOString()})`;
  }

}

export { Person };