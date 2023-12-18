CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS public;

CREATE DATABASE IF NOT EXISTS va;

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4(),

  name character varying(16384) NOT NULL,
  description character varying(16384) NOT NULL,
  location character varying(16384) NOT NULL,
  startDateTime timestamp NOT NULL,
  endDateTime timestamp NOT NULL,
  link character varying(16384),
  price numeric,

  PRIMARY KEY (id)
)
