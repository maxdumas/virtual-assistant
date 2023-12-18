import type { Generated } from 'kysely';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  events: VAEventsTable
}

export interface VAEventsTable {
  id: Generated<string>

  name: string
  description: string
  location: string
  startDateTime: string
  endDateTime: string
  link: string | null
  price: number | null
}
