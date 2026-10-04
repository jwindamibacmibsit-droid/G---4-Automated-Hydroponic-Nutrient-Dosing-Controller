--
-- PostgreSQL database dump
--

\restrict rBMCmjIAnedcogTaNAYIKLpdPxca4dEj0529bnmflseM2sZuIkUK35Y0c3xqMEl

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id bigint NOT NULL,
    device_name character varying(100) NOT NULL,
    device_type character varying(50) DEFAULT 'ESP32'::character varying NOT NULL,
    device_uid character varying(100) NOT NULL,
    firmware_version character varying(50) DEFAULT '1.0.0'::character varying,
    ip_address inet,
    status character varying(20) DEFAULT 'offline'::character varying NOT NULL,
    last_seen timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT devices_status_check CHECK (((status)::text = ANY ((ARRAY['online'::character varying, 'offline'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: dosing_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dosing_log (
    id integer NOT NULL,
    device_id integer NOT NULL,
    dosing_type character varying(30) NOT NULL,
    amount_ml numeric(10,2),
    duration_ms integer,
    trigger_type character varying(30) NOT NULL,
    target_parameter character varying(30) NOT NULL,
    before_value numeric(6,2),
    after_value numeric(6,2),
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dosing_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dosing_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dosing_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dosing_log_id_seq OWNED BY public.dosing_log.id;


--
-- Name: dosing_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dosing_logs (
    id bigint NOT NULL,
    pump_id bigint,
    nutrient_tank_id bigint,
    user_id bigint,
    dosing_type character varying(30) NOT NULL,
    amount_ml numeric(10,2) NOT NULL,
    duration_seconds numeric(10,2),
    control_mode character varying(20) DEFAULT 'auto'::character varying NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT dosing_logs_amount_ml_check CHECK ((amount_ml > (0)::numeric)),
    CONSTRAINT dosing_logs_control_mode_check CHECK (((control_mode)::text = ANY ((ARRAY['auto'::character varying, 'manual'::character varying])::text[]))),
    CONSTRAINT dosing_logs_dosing_type_check CHECK (((dosing_type)::text = ANY ((ARRAY['nutrient_a'::character varying, 'nutrient_b'::character varying, 'ph_up'::character varying, 'ph_down'::character varying])::text[]))),
    CONSTRAINT dosing_logs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: dosing_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dosing_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dosing_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dosing_logs_id_seq OWNED BY public.dosing_logs.id;


--
-- Name: nutrient_tanks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nutrient_tanks (
    id bigint NOT NULL,
    tank_name character varying(50) NOT NULL,
    nutrient_type character varying(30) NOT NULL,
    capacity_ml numeric(10,2) NOT NULL,
    current_level_ml numeric(10,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT nutrient_tanks_capacity_check CHECK ((capacity_ml > (0)::numeric)),
    CONSTRAINT nutrient_tanks_level_check CHECK (((current_level_ml >= (0)::numeric) AND (current_level_ml <= capacity_ml))),
    CONSTRAINT nutrient_tanks_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'low'::character varying, 'empty'::character varying])::text[]))),
    CONSTRAINT nutrient_tanks_type_check CHECK (((nutrient_type)::text = ANY ((ARRAY['nutrient_a'::character varying, 'nutrient_b'::character varying, 'ph_up'::character varying, 'ph_down'::character varying])::text[])))
);


--
-- Name: nutrient_tanks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nutrient_tanks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nutrient_tanks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nutrient_tanks_id_seq OWNED BY public.nutrient_tanks.id;


--
-- Name: pumps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pumps (
    id bigint NOT NULL,
    device_id bigint,
    pump_name character varying(50) NOT NULL,
    pump_type character varying(30) NOT NULL,
    pin_number integer,
    status character varying(20) DEFAULT 'inactive'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pumps_pump_type_check CHECK (((pump_type)::text = ANY ((ARRAY['nutrient_a'::character varying, 'nutrient_b'::character varying, 'ph_up'::character varying, 'ph_down'::character varying])::text[]))),
    CONSTRAINT pumps_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: pumps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pumps_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pumps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pumps_id_seq OWNED BY public.pumps.id;


--
-- Name: sensor_reading; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensor_reading (
    id integer NOT NULL,
    device_id integer NOT NULL,
    ph_value numeric(4,2),
    water_level numeric(6,2),
    temperature numeric(5,2),
    nutrient_a numeric(6,2),
    nutrient_b numeric(6,2),
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sensor_reading_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sensor_reading_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sensor_reading_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sensor_reading_id_seq OWNED BY public.sensor_reading.id;


--
-- Name: sensor_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensor_readings (
    id bigint NOT NULL,
    sensor_id bigint NOT NULL,
    reading_value numeric(12,4) NOT NULL,
    reading_status character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    recorded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT sensor_readings_reading_status_check CHECK (((reading_status)::text = ANY ((ARRAY['normal'::character varying, 'warning'::character varying, 'critical'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sensor_readings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sensor_readings_id_seq OWNED BY public.sensor_readings.id;


--
-- Name: sensors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sensors (
    id bigint NOT NULL,
    device_id bigint NOT NULL,
    sensor_name character varying(100) NOT NULL,
    sensor_type character varying(30) NOT NULL,
    gpio character varying(30),
    measurement_unit character varying(30),
    min_value numeric(12,4),
    max_value numeric(12,4),
    status character varying(20) DEFAULT 'offline'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT sensors_sensor_type_check CHECK (((sensor_type)::text = ANY ((ARRAY['water_level'::character varying, 'temperature'::character varying, 'flow'::character varying, 'ph'::character varying, 'ec'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT sensors_status_check CHECK (((status)::text = ANY ((ARRAY['online'::character varying, 'offline'::character varying, 'error'::character varying])::text[])))
);


--
-- Name: sensors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sensors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sensors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sensors_id_seq OWNED BY public.sensors.id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    id integer NOT NULL,
    user_id integer,
    device_id integer,
    level character varying(20) NOT NULL,
    category character varying(50) NOT NULL,
    event character varying(255) NOT NULL,
    details text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: system_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_logs_id_seq OWNED BY public.system_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    remember_token text,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying, 'viewer'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: dosing_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_log ALTER COLUMN id SET DEFAULT nextval('public.dosing_log_id_seq'::regclass);


--
-- Name: dosing_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_logs ALTER COLUMN id SET DEFAULT nextval('public.dosing_logs_id_seq'::regclass);


--
-- Name: nutrient_tanks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrient_tanks ALTER COLUMN id SET DEFAULT nextval('public.nutrient_tanks_id_seq'::regclass);


--
-- Name: pumps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pumps ALTER COLUMN id SET DEFAULT nextval('public.pumps_id_seq'::regclass);


--
-- Name: sensor_reading id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_reading ALTER COLUMN id SET DEFAULT nextval('public.sensor_reading_id_seq'::regclass);


--
-- Name: sensor_readings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_readings ALTER COLUMN id SET DEFAULT nextval('public.sensor_readings_id_seq'::regclass);


--
-- Name: sensors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensors ALTER COLUMN id SET DEFAULT nextval('public.sensors_id_seq'::regclass);


--
-- Name: system_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN id SET DEFAULT nextval('public.system_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devices (id, device_name, device_type, device_uid, firmware_version, ip_address, status, last_seen, created_at, updated_at) FROM stdin;
1	HydroControl ESP32	ESP32	ESP32-HYDRO-001	1.0.0	\N	online	2026-09-05 19:09:41.680551+08	2026-08-24 08:54:37.785489+08	2026-09-05 19:09:41.680551+08
\.


--
-- Data for Name: dosing_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dosing_log (id, device_id, dosing_type, amount_ml, duration_ms, trigger_type, target_parameter, before_value, after_value, status, "timestamp") FROM stdin;
\.


--
-- Data for Name: dosing_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dosing_logs (id, pump_id, nutrient_tank_id, user_id, dosing_type, amount_ml, duration_seconds, control_mode, status, created_at) FROM stdin;
\.


--
-- Data for Name: nutrient_tanks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nutrient_tanks (id, tank_name, nutrient_type, capacity_ml, current_level_ml, status, created_at) FROM stdin;
\.


--
-- Data for Name: pumps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pumps (id, device_id, pump_name, pump_type, pin_number, status, created_at) FROM stdin;
\.


--
-- Data for Name: sensor_reading; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sensor_reading (id, device_id, ph_value, water_level, temperature, nutrient_a, nutrient_b, "timestamp") FROM stdin;
1	1	20.00	30.00	20.00	50.00	10.00	2026-09-19 02:42:06+08
3	1	6.20	78.00	24.80	64.00	58.00	2026-09-19 02:54:42.849778+08
4	1	6.20	78.00	24.80	64.00	58.00	2026-09-19 02:54:44.307117+08
5	1	6.20	78.00	24.80	64.00	58.00	2026-09-19 02:54:49.389835+08
6	1	80.00	45.00	30.00	10.00	30.00	2026-09-19 16:12:16+08
\.


--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sensor_readings (id, sensor_id, reading_value, reading_status, recorded_at) FROM stdin;
1	2	6.2000	normal	2026-08-24 08:54:37.785489+08
2	3	61.0500	normal	2026-08-24 08:54:37.785489+08
3	2	0.0000	warning	2026-08-24 09:20:46.49299+08
4	3	0.0000	critical	2026-08-24 09:20:46.49299+08
5	2	0.0000	warning	2026-08-24 09:20:57.87546+08
6	3	0.0000	critical	2026-08-24 09:20:57.87546+08
7	2	0.0000	warning	2026-08-24 09:24:39.018377+08
8	3	0.0000	critical	2026-08-24 09:24:39.018377+08
9	2	0.0000	warning	2026-08-24 09:24:51.121885+08
10	3	0.0000	critical	2026-08-24 09:24:51.121885+08
11	2	0.0000	warning	2026-08-24 09:25:02.479281+08
12	3	0.0000	critical	2026-08-24 09:25:02.479281+08
13	2	0.0000	warning	2026-08-24 09:25:13.791166+08
14	3	0.0000	critical	2026-08-24 09:25:13.791166+08
15	2	0.0000	warning	2026-08-24 09:25:25.085251+08
16	3	0.0000	critical	2026-08-24 09:25:25.085251+08
17	2	3.0000	warning	2026-08-24 09:26:27.291587+08
18	3	58.1700	normal	2026-08-24 09:26:27.291587+08
19	2	3.0000	warning	2026-08-24 09:26:33.614237+08
20	3	58.1700	normal	2026-08-24 09:26:33.614237+08
21	2	3.0000	warning	2026-08-24 09:26:40.085591+08
22	3	58.1700	normal	2026-08-24 09:26:40.085591+08
23	2	10.2000	warning	2026-08-24 09:26:46.450209+08
24	3	58.1700	normal	2026-08-24 09:26:46.450209+08
25	2	10.2000	warning	2026-08-24 09:26:52.92428+08
26	3	30.0100	warning	2026-08-24 09:26:52.92428+08
39	2	10.2000	warning	2026-08-24 09:58:49.766584+08
40	3	30.0100	warning	2026-08-24 09:58:49.766584+08
41	2	10.2000	warning	2026-08-24 09:58:56.142754+08
42	3	30.0100	warning	2026-08-24 09:58:56.142754+08
43	2	4.1000	warning	2026-08-24 09:59:02.692881+08
44	3	30.0100	warning	2026-08-24 09:59:02.692881+08
45	2	2.9000	warning	2026-08-24 09:59:09.157329+08
46	3	65.2000	normal	2026-08-24 09:59:09.157329+08
47	2	6.9000	warning	2026-08-24 09:59:15.586725+08
48	3	65.2000	normal	2026-08-24 09:59:15.586725+08
49	2	6.9000	warning	2026-08-24 10:01:54.80584+08
50	3	65.2000	normal	2026-08-24 10:01:54.80584+08
51	2	6.9000	warning	2026-08-24 10:02:01.257411+08
52	3	65.2000	normal	2026-08-24 10:02:01.257411+08
53	2	3.3000	warning	2026-08-24 10:02:07.652272+08
54	3	65.2000	normal	2026-08-24 10:02:07.652272+08
55	2	3.3000	warning	2026-08-24 10:02:14.276861+08
56	3	37.7300	warning	2026-08-24 10:02:14.276861+08
57	2	7.1000	warning	2026-08-24 10:02:20.743457+08
58	3	87.0100	normal	2026-08-24 10:02:20.743457+08
59	2	7.1000	warning	2026-08-24 10:02:27.059429+08
60	3	87.0100	normal	2026-08-24 10:02:27.059429+08
61	2	0.0000	error	2026-08-24 10:56:04.05619+08
62	3	0.0000	critical	2026-08-24 10:56:04.05619+08
63	2	0.0000	error	2026-08-24 10:56:15.921889+08
64	3	0.0000	critical	2026-08-24 10:56:15.921889+08
65	2	13.1000	warning	2026-08-24 10:56:27.552615+08
66	3	0.0000	critical	2026-08-24 10:56:27.552615+08
67	2	13.1000	warning	2026-08-24 10:56:34.159878+08
68	3	62.5600	normal	2026-08-24 10:56:34.159878+08
69	2	13.1000	warning	2026-08-24 10:56:40.853203+08
70	3	62.5600	normal	2026-08-24 10:56:40.853203+08
71	2	14.0000	warning	2026-08-24 10:56:47.440596+08
72	3	100.0000	normal	2026-08-24 10:56:47.440596+08
73	2	14.0000	warning	2026-08-24 11:12:15.736612+08
74	3	100.0000	normal	2026-08-24 11:12:15.736612+08
75	2	14.0000	warning	2026-08-24 11:12:22.39706+08
76	3	100.0000	normal	2026-08-24 11:12:22.39706+08
77	2	8.4000	warning	2026-08-24 11:12:33.987423+08
78	3	0.0000	critical	2026-08-24 11:12:33.987423+08
79	2	4.0000	warning	2026-08-24 11:12:58.279851+08
80	3	66.6700	normal	2026-08-24 11:12:58.279851+08
81	2	9.0000	warning	2026-08-24 11:13:04.941891+08
82	3	66.6700	normal	2026-08-24 11:13:04.941891+08
83	2	9.0000	warning	2026-08-24 11:13:12.042736+08
84	3	66.6700	normal	2026-08-24 11:13:12.042736+08
85	2	9.0000	warning	2026-08-24 11:13:19.005929+08
86	3	66.6700	normal	2026-08-24 11:13:19.005929+08
87	2	9.0000	warning	2026-08-24 11:22:40.530138+08
88	3	26.3000	critical	2026-08-24 11:22:40.530138+08
89	2	14.0000	warning	2026-08-24 11:22:47.699377+08
90	3	36.6500	warning	2026-08-24 11:22:47.699377+08
91	2	14.0000	warning	2026-08-24 11:22:54.243484+08
92	3	36.6500	warning	2026-08-24 11:22:54.243484+08
93	2	14.0000	warning	2026-08-24 11:23:00.76692+08
94	3	36.6500	warning	2026-08-24 11:23:00.76692+08
95	2	14.0000	warning	2026-08-24 11:23:07.301116+08
96	3	36.6500	warning	2026-08-24 11:23:07.301116+08
97	2	14.0000	warning	2026-08-24 11:23:13.915877+08
98	3	36.6500	warning	2026-08-24 11:23:13.915877+08
99	2	14.0000	warning	2026-08-24 12:14:16.55152+08
100	3	36.6500	warning	2026-08-24 12:14:16.55152+08
101	2	14.0000	warning	2026-08-24 12:14:23.095878+08
102	3	36.6500	warning	2026-08-24 12:14:23.095878+08
103	2	14.0000	warning	2026-08-24 12:14:30.770471+08
104	3	36.6500	warning	2026-08-24 12:14:30.770471+08
105	2	8.2000	warning	2026-08-24 12:14:37.578295+08
106	3	36.6500	warning	2026-08-24 12:14:37.578295+08
107	2	8.2000	warning	2026-08-24 12:27:54.246707+08
108	3	66.2800	normal	2026-08-24 12:27:54.246707+08
109	2	13.1000	warning	2026-08-24 12:28:01.874695+08
110	3	96.6800	normal	2026-08-24 12:28:01.874695+08
111	2	13.1000	warning	2026-08-24 12:28:08.878107+08
112	3	96.6800	normal	2026-08-24 12:28:08.878107+08
113	2	13.1000	warning	2026-08-24 12:28:15.782161+08
114	3	96.6800	normal	2026-08-24 12:28:15.782161+08
115	2	13.1000	warning	2026-08-24 12:28:23.115615+08
116	3	96.6800	normal	2026-08-24 12:28:23.115615+08
117	2	13.1000	warning	2026-08-24 12:28:30.319649+08
118	3	96.6800	normal	2026-08-24 12:28:30.319649+08
119	2	13.1000	warning	2026-08-24 12:28:37.869403+08
120	3	96.6800	normal	2026-08-24 12:28:37.869403+08
121	2	13.1000	warning	2026-08-24 12:28:45.308546+08
122	3	96.6800	normal	2026-08-24 12:28:45.308546+08
123	2	13.1000	warning	2026-08-24 12:28:52.117044+08
124	3	96.2900	normal	2026-08-24 12:28:52.117044+08
125	2	13.1000	warning	2026-08-24 12:28:58.742453+08
126	3	36.6500	warning	2026-08-24 12:28:58.742453+08
127	2	1.4000	warning	2026-08-24 12:29:05.357813+08
128	3	36.6500	warning	2026-08-24 12:29:05.357813+08
129	2	1.4000	warning	2026-08-24 12:29:12.013646+08
130	3	36.6500	warning	2026-08-24 12:29:12.013646+08
131	2	5.0000	warning	2026-08-24 12:29:18.637255+08
132	3	36.6500	warning	2026-08-24 12:29:18.637255+08
133	2	5.0000	warning	2026-08-24 12:29:25.213281+08
134	3	48.4700	normal	2026-08-24 12:29:25.213281+08
135	2	5.0000	warning	2026-08-24 12:29:31.731552+08
136	3	48.4700	normal	2026-08-24 12:29:31.731552+08
137	2	5.0000	warning	2026-08-24 12:29:38.413835+08
138	3	48.4700	normal	2026-08-24 12:29:38.413835+08
139	2	5.0000	warning	2026-08-24 12:29:45.031144+08
140	3	48.4700	normal	2026-08-24 12:29:45.031144+08
141	2	8.9000	warning	2026-08-24 12:29:51.556321+08
142	3	48.4700	normal	2026-08-24 12:29:51.556321+08
143	2	8.9000	warning	2026-08-24 12:29:58.044485+08
144	3	48.4700	normal	2026-08-24 12:29:58.044485+08
145	2	8.9000	warning	2026-08-24 12:30:04.553363+08
146	3	60.4200	normal	2026-08-24 12:30:04.553363+08
147	2	8.9000	warning	2026-08-24 12:30:11.092641+08
148	3	60.4200	normal	2026-08-24 12:30:11.092641+08
149	2	8.9000	warning	2026-08-24 13:16:25.944455+08
150	3	60.4200	normal	2026-08-24 13:16:25.944455+08
151	2	8.9000	warning	2026-08-24 13:16:32.387795+08
152	3	60.4200	normal	2026-08-24 13:16:32.387795+08
153	2	8.9000	warning	2026-08-24 13:16:38.787014+08
154	3	60.4200	normal	2026-08-24 13:16:38.787014+08
161	2	10.7000	warning	2026-08-24 13:17:04.229262+08
162	3	100.0000	normal	2026-08-24 13:17:04.229262+08
163	2	10.7000	warning	2026-08-24 13:17:10.716417+08
164	3	100.0000	normal	2026-08-24 13:17:10.716417+08
165	2	14.0000	warning	2026-08-24 13:17:17.163123+08
166	3	60.0200	normal	2026-08-24 13:17:17.163123+08
167	2	14.0000	warning	2026-08-24 13:18:00.735186+08
168	3	70.3800	normal	2026-08-24 13:18:00.735186+08
169	2	14.0000	warning	2026-08-24 13:18:07.09386+08
170	3	73.3100	normal	2026-08-24 13:18:07.09386+08
171	2	14.0000	warning	2026-08-24 13:18:13.602259+08
172	3	73.3100	normal	2026-08-24 13:18:13.602259+08
173	2	14.0000	warning	2026-08-24 13:18:20.047852+08
174	3	73.3100	normal	2026-08-24 13:18:20.047852+08
175	2	14.0000	warning	2026-08-24 13:18:26.527414+08
176	3	73.3100	normal	2026-08-24 13:18:26.527414+08
177	2	8.4000	warning	2026-08-24 13:18:32.934259+08
178	3	73.3100	normal	2026-08-24 13:18:32.934259+08
179	2	8.4000	warning	2026-08-24 13:18:39.455268+08
180	3	73.3100	normal	2026-08-24 13:18:39.455268+08
181	2	8.4000	warning	2026-08-24 13:18:45.871209+08
182	3	73.3100	normal	2026-08-24 13:18:45.871209+08
183	2	8.4000	warning	2026-08-24 13:40:23.007675+08
184	3	73.3100	normal	2026-08-24 13:40:23.007675+08
185	2	8.4000	warning	2026-08-24 13:40:29.324284+08
186	3	73.3100	normal	2026-08-24 13:40:29.324284+08
195	2	9.1000	warning	2026-08-24 13:43:57.82568+08
196	3	66.2800	normal	2026-08-24 13:43:57.82568+08
197	2	9.1000	warning	2026-08-24 13:44:04.16728+08
198	3	66.2800	normal	2026-08-24 13:44:04.16728+08
199	2	9.1000	warning	2026-08-24 13:44:10.532067+08
200	3	66.2800	normal	2026-08-24 13:44:10.532067+08
201	2	9.1000	warning	2026-08-24 13:44:16.839299+08
202	3	66.2800	normal	2026-08-24 13:44:16.839299+08
203	2	9.1000	warning	2026-08-24 13:44:27.372929+08
204	3	66.2800	normal	2026-08-24 13:44:27.372929+08
205	2	9.1000	warning	2026-08-24 13:44:33.702534+08
206	3	66.2800	normal	2026-08-24 13:44:33.702534+08
207	2	2.2000	warning	2026-08-24 13:44:40.463775+08
208	3	66.2800	normal	2026-08-24 13:44:40.463775+08
209	2	2.2000	warning	2026-08-24 13:44:46.870929+08
210	3	66.2800	normal	2026-08-24 13:44:46.870929+08
211	2	2.2000	warning	2026-08-24 13:44:53.24296+08
212	3	100.0000	normal	2026-08-24 13:44:53.24296+08
213	2	2.2000	warning	2026-08-24 13:44:59.679617+08
214	3	100.0000	normal	2026-08-24 13:44:59.679617+08
215	2	2.2000	warning	2026-08-24 13:45:11.277582+08
216	3	20.3400	critical	2026-08-24 13:45:11.277582+08
217	2	2.2000	warning	2026-08-24 13:45:22.636279+08
218	3	20.3400	critical	2026-08-24 13:45:22.636279+08
219	2	9.6000	warning	2026-08-24 13:45:34.075784+08
220	3	20.3400	critical	2026-08-24 13:45:34.075784+08
221	2	9.6000	warning	2026-08-24 13:45:45.423046+08
222	3	20.3400	critical	2026-08-24 13:45:45.423046+08
223	2	14.0000	warning	2026-08-24 13:45:56.745076+08
224	3	20.3400	critical	2026-08-24 13:45:56.745076+08
225	2	14.0000	warning	2026-08-24 13:47:08.884151+08
226	3	20.3400	critical	2026-08-24 13:47:08.884151+08
235	2	3.4000	warning	2026-08-24 13:48:01.921202+08
236	3	54.0700	normal	2026-08-24 13:48:01.921202+08
237	2	3.4000	warning	2026-08-24 13:48:08.344748+08
238	3	54.0700	normal	2026-08-24 13:48:08.344748+08
239	2	3.4000	warning	2026-08-24 13:48:14.650799+08
240	3	54.0700	normal	2026-08-24 13:48:14.650799+08
241	2	3.0000	warning	2026-08-24 14:35:21.178707+08
242	3	26.8600	critical	2026-08-24 14:35:21.178707+08
243	2	4.0000	warning	2026-08-24 14:35:27.721328+08
244	3	32.6500	warning	2026-08-24 14:35:27.721328+08
245	2	4.3000	warning	2026-08-24 14:35:34.402801+08
246	3	37.8000	warning	2026-08-24 14:35:34.402801+08
247	2	3.9000	warning	2026-08-24 14:35:40.660804+08
248	3	40.2400	normal	2026-08-24 14:35:40.660804+08
249	2	12.5000	warning	2026-08-24 14:36:30.486669+08
250	3	12.2600	critical	2026-08-24 14:36:30.486669+08
251	2	12.4000	warning	2026-08-24 14:36:41.80027+08
252	3	16.7500	critical	2026-08-24 14:36:41.80027+08
253	2	11.9000	warning	2026-08-24 14:36:53.458073+08
254	3	20.2000	critical	2026-08-24 14:36:53.458073+08
255	2	11.8000	warning	2026-08-24 14:37:04.968548+08
256	3	24.8100	critical	2026-08-24 14:37:04.968548+08
267	2	5.7000	warning	2026-08-24 15:54:44.754841+08
268	3	54.0700	normal	2026-08-24 15:54:44.754841+08
269	2	11.3000	warning	2026-08-24 15:54:53.677039+08
270	3	54.0700	normal	2026-08-24 15:54:53.677039+08
271	2	11.3000	warning	2026-08-24 15:58:57.563182+08
272	3	54.0700	normal	2026-08-24 15:58:57.563182+08
273	2	11.3000	warning	2026-08-24 15:59:04.849754+08
274	3	94.0400	normal	2026-08-24 15:59:04.849754+08
275	2	11.3000	warning	2026-08-24 15:59:12.548225+08
276	3	94.0400	normal	2026-08-24 15:59:12.548225+08
277	2	5.7000	warning	2026-08-24 15:59:20.156729+08
278	3	94.0400	normal	2026-08-24 15:59:20.156729+08
279	2	5.7000	warning	2026-08-24 15:59:27.932296+08
280	3	94.0400	normal	2026-08-24 15:59:27.932296+08
281	2	14.0000	warning	2026-08-24 15:59:34.795501+08
282	3	94.0400	normal	2026-08-24 15:59:34.795501+08
283	2	14.0000	warning	2026-08-24 15:59:42.160476+08
284	3	94.0400	normal	2026-08-24 15:59:42.160476+08
285	2	10.8000	warning	2026-08-24 15:59:49.267451+08
286	3	94.0400	normal	2026-08-24 15:59:49.267451+08
287	2	10.8000	warning	2026-08-24 16:00:01.940324+08
288	3	94.0400	normal	2026-08-24 16:00:01.940324+08
289	2	10.8000	warning	2026-08-24 16:00:13.25533+08
290	3	94.0400	normal	2026-08-24 16:00:13.25533+08
291	2	1.4000	warning	2026-08-26 12:33:49.805463+08
292	3	100.0000	normal	2026-08-26 12:33:49.805463+08
293	2	1.4000	warning	2026-08-26 12:33:56.216523+08
294	3	100.0000	normal	2026-08-26 12:33:56.216523+08
295	2	4.0000	warning	2026-08-26 12:34:02.629261+08
296	3	100.0000	normal	2026-08-26 12:34:02.629261+08
297	2	9.1000	warning	2026-08-26 12:34:09.032547+08
298	3	100.0000	normal	2026-08-26 12:34:09.032547+08
299	2	9.1000	warning	2026-08-26 12:34:15.483648+08
300	3	100.0000	normal	2026-08-26 12:34:15.483648+08
301	2	9.1000	warning	2026-08-26 12:34:22.123678+08
302	3	100.0000	normal	2026-08-26 12:34:22.123678+08
303	2	9.1000	warning	2026-08-26 12:34:28.698303+08
304	3	100.0000	normal	2026-08-26 12:34:28.698303+08
305	2	9.1000	warning	2026-08-26 12:34:35.349611+08
306	3	100.0000	normal	2026-08-26 12:34:35.349611+08
307	2	9.1000	warning	2026-08-26 12:34:41.983731+08
308	3	100.0000	normal	2026-08-26 12:34:41.983731+08
309	2	9.1000	warning	2026-08-26 12:34:48.707845+08
310	3	100.0000	normal	2026-08-26 12:34:48.707845+08
311	2	9.1000	warning	2026-08-26 12:34:55.126571+08
312	3	100.0000	normal	2026-08-26 12:34:55.126571+08
313	2	3.0000	warning	2026-08-26 12:35:01.491658+08
314	3	100.0000	normal	2026-08-26 12:35:01.491658+08
315	2	3.0000	warning	2026-08-26 12:35:07.796828+08
316	3	100.0000	normal	2026-08-26 12:35:07.796828+08
317	2	3.0000	warning	2026-08-26 12:35:14.124406+08
318	3	100.0000	normal	2026-08-26 12:35:14.124406+08
319	2	3.0000	warning	2026-08-26 12:35:20.487146+08
320	3	70.3800	normal	2026-08-26 12:35:20.487146+08
321	2	3.0000	warning	2026-08-26 12:35:26.875357+08
322	3	68.1300	normal	2026-08-26 12:35:26.875357+08
323	2	3.0000	warning	2026-08-26 12:35:33.278859+08
324	3	68.1300	normal	2026-08-26 12:35:33.278859+08
325	2	3.0000	warning	2026-08-26 12:35:39.617888+08
326	3	68.1300	normal	2026-08-26 12:35:39.617888+08
327	2	3.0000	warning	2026-08-26 12:35:46.002471+08
328	3	68.1300	normal	2026-08-26 12:35:46.002471+08
329	2	3.0000	warning	2026-08-26 12:35:52.505799+08
330	3	68.1300	normal	2026-08-26 12:35:52.505799+08
331	2	3.0000	warning	2026-08-26 12:35:58.898744+08
332	3	68.1300	normal	2026-08-26 12:35:58.898744+08
333	2	3.0000	warning	2026-08-26 12:36:05.33304+08
334	3	68.1300	normal	2026-08-26 12:36:05.33304+08
335	2	3.0000	warning	2026-08-26 12:36:16.69908+08
336	3	0.0000	critical	2026-08-26 12:36:16.69908+08
345	2	2.8000	warning	2026-08-26 12:37:13.720204+08
346	3	29.2300	critical	2026-08-26 12:37:13.720204+08
347	2	8.1000	warning	2026-08-26 12:37:25.114332+08
348	3	29.2300	critical	2026-08-26 12:37:25.114332+08
349	2	8.1000	warning	2026-08-26 12:37:36.467507+08
350	3	29.2300	critical	2026-08-26 12:37:36.467507+08
351	2	8.1000	warning	2026-08-26 12:37:47.866033+08
352	3	29.2300	critical	2026-08-26 12:37:47.866033+08
353	2	8.1000	warning	2026-08-26 12:37:54.170268+08
354	3	53.3800	normal	2026-08-26 12:37:54.170268+08
355	2	8.1000	warning	2026-08-26 12:38:00.610218+08
356	3	54.4600	normal	2026-08-26 12:38:00.610218+08
357	2	8.1000	warning	2026-08-26 12:38:07.091155+08
358	3	81.1200	normal	2026-08-26 12:38:07.091155+08
359	2	8.1000	warning	2026-08-26 12:38:13.450511+08
360	3	81.1200	normal	2026-08-26 12:38:13.450511+08
361	2	2.3000	warning	2026-08-26 12:38:19.903709+08
362	3	81.1200	normal	2026-08-26 12:38:19.903709+08
363	2	2.3000	warning	2026-08-26 12:38:26.515436+08
364	3	81.1200	normal	2026-08-26 12:38:26.515436+08
369	2	6.5000	normal	2026-09-05 19:09:34.993195+08
370	3	37.0500	warning	2026-09-05 19:09:34.993195+08
371	2	6.5000	normal	2026-09-05 19:09:38.358001+08
372	3	37.0500	warning	2026-09-05 19:09:38.358001+08
373	2	6.5000	normal	2026-09-05 19:09:41.680551+08
374	3	37.0500	warning	2026-09-05 19:09:41.680551+08
\.


--
-- Data for Name: sensors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sensors (id, device_id, sensor_name, sensor_type, gpio, measurement_unit, min_value, max_value, status, created_at) FROM stdin;
2	1	pH Sensor	ph	GPIO 34	pH	5.8000	6.5000	online	2026-08-24 08:54:37.785489+08
3	1	Water Level Sensor	water_level	GPIO 35	%	30.0000	100.0000	online	2026-08-24 08:54:37.785489+08
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_logs (id, user_id, device_id, level, category, event, details, "timestamp") FROM stdin;
1	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 13:37:25.096164+08
2	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 13:39:11.346917+08
3	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 13:44:13.712001+08
4	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 13:47:22.007298+08
5	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 14:29:27.640551+08
6	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 14:54:29.940159+08
7	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 14:57:01.19423+08
8	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 16:04:18.928056+08
9	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 17:04:34.873046+08
10	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 17:30:00.035235+08
11	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 18:06:56.639953+08
12	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 18:24:06.508581+08
13	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-26 18:25:05.221566+08
14	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 13:39:58.531386+08
15	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 13:41:22.419198+08
16	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 15:09:35.652993+08
17	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 15:26:46.172891+08
18	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 15:55:52.251091+08
19	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 15:57:11.093232+08
20	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 16:05:34.308114+08
21	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 16:22:43.144226+08
22	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 16:25:17.11813+08
23	2	\N	SUCCESS	AUTH	User login successful	User hydro@gmail.com logged into HydroControl.	2026-09-27 16:32:26.542414+08
24	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 16:56:08.417325+08
25	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:02:51.436861+08
26	2	\N	SUCCESS	AUTH	User login successful	User hydro@gmail.com logged into HydroControl.	2026-09-27 17:03:34.287747+08
27	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:17:03.507382+08
28	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:19:31.579786+08
29	2	\N	SUCCESS	AUTH	User login successful	User hydro@gmail.com logged into HydroControl.	2026-09-27 17:19:56.583161+08
30	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:30:58.417351+08
31	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:31:29.230965+08
32	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:33:55.999117+08
33	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:36:01.733553+08
34	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:52:25.357457+08
35	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 17:57:20.754008+08
36	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-27 18:26:05.192338+08
37	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 00:07:35.652123+08
38	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 00:31:21.091071+08
39	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 00:39:27.132349+08
40	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 00:50:51.168473+08
41	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 01:25:15.671123+08
42	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 02:15:58.351474+08
43	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 03:48:53.263899+08
44	2	\N	SUCCESS	AUTH	User login successful	User hydro@gmail.com logged into HydroControl.	2026-09-29 03:54:58.947234+08
45	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 12:49:11.2025+08
46	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 12:50:22.508434+08
47	1	\N	SUCCESS	AUTH	User login successful	User admin@hydrocontrol.com logged into HydroControl.	2026-09-29 12:51:01.162135+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, remember_token, last_login, created_at, updated_at) FROM stdin;
2	hydro	hydro@gmail.com	$2a$12$8KKosGDtKXvuwh6Jasc.nupcwyG64ENo53Xr7ccOSI9jn6VdAoT76	admin	\N	2026-09-29 03:54:58.924698+08	2026-09-27 16:31:50.192064+08	2026-09-29 03:54:58.924698+08
1	HydroControl Admin	admin@hydrocontrol.com	$2a$12$XD8DiVUzvlgUsi7nKdC5yeT5bTYBWPDuV5jV/uEKbS/fvEHsC8Fqe	admin	34381472293f21ef4af74fddc6a175fd36fb6b7f12ed8a142d5b2e7bfd6728be	2026-09-29 12:51:01.160462+08	2026-08-24 12:45:05.791973+08	2026-09-29 12:51:01.160462+08
\.


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, true);


--
-- Name: dosing_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dosing_log_id_seq', 1, false);


--
-- Name: dosing_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dosing_logs_id_seq', 1, false);


--
-- Name: nutrient_tanks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nutrient_tanks_id_seq', 1, false);


--
-- Name: pumps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pumps_id_seq', 1, false);


--
-- Name: sensor_reading_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sensor_reading_id_seq', 5, true);


--
-- Name: sensor_readings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sensor_readings_id_seq', 374, true);


--
-- Name: sensors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sensors_id_seq', 3, true);


--
-- Name: system_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_logs_id_seq', 47, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: devices devices_device_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_device_uid_key UNIQUE (device_uid);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: dosing_log dosing_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_log
    ADD CONSTRAINT dosing_log_pkey PRIMARY KEY (id);


--
-- Name: dosing_logs dosing_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_logs
    ADD CONSTRAINT dosing_logs_pkey PRIMARY KEY (id);


--
-- Name: nutrient_tanks nutrient_tanks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrient_tanks
    ADD CONSTRAINT nutrient_tanks_pkey PRIMARY KEY (id);


--
-- Name: pumps pumps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pumps
    ADD CONSTRAINT pumps_pkey PRIMARY KEY (id);


--
-- Name: sensor_reading sensor_reading_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_reading
    ADD CONSTRAINT sensor_reading_pkey PRIMARY KEY (id);


--
-- Name: sensor_readings sensor_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT sensor_readings_pkey PRIMARY KEY (id);


--
-- Name: sensors sensors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensors
    ADD CONSTRAINT sensors_pkey PRIMARY KEY (id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_sensor_readings_sensor_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sensor_readings_sensor_time ON public.sensor_readings USING btree (sensor_id, recorded_at DESC);


--
-- Name: dosing_log fk_dosing_device; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_log
    ADD CONSTRAINT fk_dosing_device FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: dosing_logs fk_dosing_pump; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_logs
    ADD CONSTRAINT fk_dosing_pump FOREIGN KEY (pump_id) REFERENCES public.pumps(id);


--
-- Name: dosing_logs fk_dosing_tank; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_logs
    ADD CONSTRAINT fk_dosing_tank FOREIGN KEY (nutrient_tank_id) REFERENCES public.nutrient_tanks(id);


--
-- Name: dosing_logs fk_dosing_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dosing_logs
    ADD CONSTRAINT fk_dosing_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pumps fk_pump_device; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pumps
    ADD CONSTRAINT fk_pump_device FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: sensor_readings fk_reading_sensor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT fk_reading_sensor FOREIGN KEY (sensor_id) REFERENCES public.sensors(id) ON DELETE CASCADE;


--
-- Name: sensor_reading fk_sensor_device; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensor_reading
    ADD CONSTRAINT fk_sensor_device FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: sensors fk_sensor_device; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sensors
    ADD CONSTRAINT fk_sensor_device FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: system_logs system_logs_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: system_logs system_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rBMCmjIAnedcogTaNAYIKLpdPxca4dEj0529bnmflseM2sZuIkUK35Y0c3xqMEl

