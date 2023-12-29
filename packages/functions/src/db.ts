import type { Generated } from 'kysely';
import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  ['public.events']: VAEventsTable
}

export interface VAEventsTable {
  id: Generated<string>

  name: string
  description: string
  location: string
  startDateTime: Date
  endDateTime: Date
  link: string | null
  price: number | null
}
