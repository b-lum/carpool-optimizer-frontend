class Roster {
  constructor(people = new Map(), comparator = null) {
    // Accept either a Map or an array of [email, person] pairs
    this.people = new Map(people)
    this.comparator = comparator
  }

  withComparator(comparator) {
    const next = new Roster(this.people, comparator)
    next.sort()
    return next
  }

  add(person) {
    const next = new Roster(this.people, this.comparator)
    next.people.set(person.email, person)
    next.sort()
    console.log(`adding ${person.name} to roster`)
    return next
  }

  remove(email) {
    const next = new Roster(this.people, this.comparator)
    next.people.delete(email)
    return next
  }

  get(email) {
    return this.people.get(email) ?? null
  }

  has(email) {
    return this.people.has(email)
  }

  // Sort by rebuilding the Map from a sorted entries array
  sort() {
    if (!this.comparator) return
    const sorted = [...this.people.entries()].sort(([, a], [, b]) =>
      this.comparator(a, b)
    )
    this.people = new Map(sorted)
  }

  // Returns plain array of Person instances (not [key, value] pairs)
  toArray() {
    return [...this.people.values()]
  }

  get size() {
    return this.people.size
  }
}

export { Roster }