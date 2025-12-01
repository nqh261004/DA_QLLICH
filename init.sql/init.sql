--
-- PostgreSQL database dump
--

\restrict KeFKJmgIDftJBt767jFrkx3shoNd5pUf59QVbOHwDoV3BqIYBh0P8nXJRGFVjef

-- Dumped from database version 13.22 (Debian 13.22-1.pgdg13+1)
-- Dumped by pg_dump version 13.22 (Debian 13.22-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: cong_viec_trang_thai_enum; Type: TYPE; Schema: public; Owner: quyhung
--

CREATE TYPE public.cong_viec_trang_thai_enum AS ENUM (
    'can_lam',
    'dang_lam',
    'cho_duyet',
    'can_sua',
    'phe_duyet',
    'bi_huy'
);


ALTER TYPE public.cong_viec_trang_thai_enum OWNER TO quyhung;

--
-- Name: du_an_trang_thai_enum; Type: TYPE; Schema: public; Owner: quyhung
--

CREATE TYPE public.du_an_trang_thai_enum AS ENUM (
    'sap_bat_dau',
    'dang_tien_hanh',
    'hoan_thanh',
    'huy'
);


ALTER TYPE public.du_an_trang_thai_enum OWNER TO quyhung;

--
-- Name: nguoi_dung_vai_tro_enum; Type: TYPE; Schema: public; Owner: quyhung
--

CREATE TYPE public.nguoi_dung_vai_tro_enum AS ENUM (
    'quan_ly',
    'nhan_vien'
);


ALTER TYPE public.nguoi_dung_vai_tro_enum OWNER TO quyhung;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cong_viec; Type: TABLE; Schema: public; Owner: quyhung
--

CREATE TABLE public.cong_viec (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    tieu_de character varying(255) NOT NULL,
    mo_ta text,
    trang_thai public.cong_viec_trang_thai_enum DEFAULT 'can_lam'::public.cong_viec_trang_thai_enum NOT NULL,
    muc_do_uu_tien integer DEFAULT 0 NOT NULL,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_cap_nhat timestamp without time zone DEFAULT now() NOT NULL,
    han_chot timestamp without time zone,
    "duAnId" uuid NOT NULL,
    "nguoiThucHienId" uuid,
    "nguoiGiaoViecId" uuid
);


ALTER TABLE public.cong_viec OWNER TO quyhung;

--
-- Name: du_an; Type: TABLE; Schema: public; Owner: quyhung
--

CREATE TABLE public.du_an (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ten_du_an character varying(150) NOT NULL,
    mo_ta text,
    trang_thai public.du_an_trang_thai_enum DEFAULT 'sap_bat_dau'::public.du_an_trang_thai_enum NOT NULL,
    ngay_bat_dau timestamp with time zone,
    ngay_ket_thuc_du_kien timestamp with time zone,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_cap_nhat timestamp without time zone DEFAULT now() NOT NULL,
    "nguoiQuanLyId" uuid,
    "phongBanId" uuid
);


ALTER TABLE public.du_an OWNER TO quyhung;

--
-- Name: file_dinh_kem; Type: TABLE; Schema: public; Owner: quyhung
--

CREATE TABLE public.file_dinh_kem (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ten_file_goc character varying NOT NULL,
    ten_file_luu character varying NOT NULL,
    duong_dan character varying NOT NULL,
    kich_thuoc integer NOT NULL,
    mimetype character varying NOT NULL,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    "congViecId" uuid
);


ALTER TABLE public.file_dinh_kem OWNER TO quyhung;

--
-- Name: nguoi_dung; Type: TABLE; Schema: public; Owner: quyhung
--

CREATE TABLE public.nguoi_dung (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ho_ten character varying(100) NOT NULL,
    email character varying NOT NULL,
    mat_khau character varying NOT NULL,
    vai_tro public.nguoi_dung_vai_tro_enum DEFAULT 'nhan_vien'::public.nguoi_dung_vai_tro_enum NOT NULL,
    trang_thai_hoat_dong boolean DEFAULT true NOT NULL,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_cap_nhat timestamp without time zone DEFAULT now() NOT NULL,
    "phongBanId" uuid
);


ALTER TABLE public.nguoi_dung OWNER TO quyhung;

--
-- Name: phong_ban; Type: TABLE; Schema: public; Owner: quyhung
--

CREATE TABLE public.phong_ban (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ten_phong_ban character varying(100) NOT NULL,
    ngay_tao timestamp without time zone DEFAULT now() NOT NULL,
    ngay_cap_nhat timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.phong_ban OWNER TO quyhung;

--
-- Data for Name: cong_viec; Type: TABLE DATA; Schema: public; Owner: quyhung
--

COPY public.cong_viec (id, tieu_de, mo_ta, trang_thai, muc_do_uu_tien, ngay_tao, ngay_cap_nhat, han_chot, "duAnId", "nguoiThucHienId", "nguoiGiaoViecId") FROM stdin;
cddf7164-b730-4bba-b66a-225431c39327	Lên ý tưởng dự án	mô tả...	can_lam	5	2025-12-01 22:05:08.3146	2025-12-01 22:05:08.3146	2025-12-07 00:00:00	5d4a8b7f-77e8-4d42-b85b-fd633b361a38	186110d1-6d68-41f1-8ba4-e1f05ecdecfc	7a79434d-f828-48b2-b4ef-9727ba9a421a
58146f84-2649-45f9-9609-69fd76d0cc31	Lên ý tưởng dự án	mô tả...	cho_duyet	5	2025-12-01 22:05:08.3146	2025-12-01 22:06:23.670604	2025-12-07 00:00:00	5d4a8b7f-77e8-4d42-b85b-fd633b361a38	da5ce9d2-045c-4a66-a5db-4444267ba137	7a79434d-f828-48b2-b4ef-9727ba9a421a
6281e09c-e702-4763-a8e1-6d7acd5bfd89	Lên ý tưởng dự án	mô tả...	dang_lam	5	2025-12-01 22:05:08.3146	2025-12-01 22:06:45.303394	2025-12-07 00:00:00	5d4a8b7f-77e8-4d42-b85b-fd633b361a38	d0ccb99a-faa8-4834-ad69-a6da926efff1	7a79434d-f828-48b2-b4ef-9727ba9a421a
\.


--
-- Data for Name: du_an; Type: TABLE DATA; Schema: public; Owner: quyhung
--

COPY public.du_an (id, ten_du_an, mo_ta, trang_thai, ngay_bat_dau, ngay_ket_thuc_du_kien, ngay_tao, ngay_cap_nhat, "nguoiQuanLyId", "phongBanId") FROM stdin;
5d4a8b7f-77e8-4d42-b85b-fd633b361a38	Xây dựng hệ thống ABC	mô tả dự án.....	dang_tien_hanh	2025-12-02 00:00:00+00	2025-12-07 00:00:00+00	2025-12-01 22:04:29.621756	2025-12-01 22:05:41.232139	7a79434d-f828-48b2-b4ef-9727ba9a421a	4948f87e-3033-4c98-8968-27021921b9f8
\.


--
-- Data for Name: file_dinh_kem; Type: TABLE DATA; Schema: public; Owner: quyhung
--

COPY public.file_dinh_kem (id, ten_file_goc, ten_file_luu, duong_dan, kich_thuoc, mimetype, ngay_tao, "congViecId") FROM stdin;
5091ff60-a835-418b-9cc1-eb88abbadcf9	abc.pdf	276da10f749f674673db3f10e36eb568.pdf	uploads/276da10f749f674673db3f10e36eb568.pdf	223603	application/pdf	2025-12-01 22:06:23.677258	58146f84-2649-45f9-9609-69fd76d0cc31
\.


--
-- Data for Name: nguoi_dung; Type: TABLE DATA; Schema: public; Owner: quyhung
--

COPY public.nguoi_dung (id, ho_ten, email, mat_khau, vai_tro, trang_thai_hoat_dong, ngay_tao, ngay_cap_nhat, "phongBanId") FROM stdin;
7a79434d-f828-48b2-b4ef-9727ba9a421a	Admin Hệ Thống	admin@gmail.com	$2b$10$Yy10mS9msSx8TKZgzOhKrO.yYmHItz//ooAQIUE9G6cyaW5f0XAr6	quan_ly	t	2025-12-01 21:59:26.219377	2025-12-01 21:59:26.219377	4948f87e-3033-4c98-8968-27021921b9f8
da5ce9d2-045c-4a66-a5db-4444267ba137	Quý Hưng	tendangnhap013@gmail.com	$2b$10$NodHshRua7sZo2.X5ly4uOA7Sy6/QipaVJrOuKQOoJ/tswUre.sFa	nhan_vien	t	2025-12-01 22:00:42.053172	2025-12-01 22:00:42.053172	4948f87e-3033-4c98-8968-27021921b9f8
c64a47fa-9f30-4af4-95ee-4f86686510cc	Hưng QL	ngquyhung2610@gmail.com	$2b$10$IOGMPXJXHPymJexMdC4R1.PQ/omlXE9ZQ9YzvNr/g/cVSbdhRT5UG	quan_ly	t	2025-12-01 22:01:08.320086	2025-12-01 22:01:08.320086	4948f87e-3033-4c98-8968-27021921b9f8
d0ccb99a-faa8-4834-ad69-a6da926efff1	Nhân viên 1	2200008080@nttu.edu.vn	$2b$10$RIWO/y20N90g/UtBV77oa.JebeIQFXPZ5mqit6FyPzs5wQBGHtoyO	nhan_vien	t	2025-12-01 22:01:36.005641	2025-12-01 22:01:36.005641	4948f87e-3033-4c98-8968-27021921b9f8
186110d1-6d68-41f1-8ba4-e1f05ecdecfc	Vân	vn010999@gmail.com	$2b$10$u79b9XUOE2W/3NoIdGGave4VxlZI/o0Tr5xnl6IqGKb2tx7Rbg2v2	nhan_vien	t	2025-12-01 22:02:14.74186	2025-12-01 22:02:14.74186	4948f87e-3033-4c98-8968-27021921b9f8
c5d53aaf-c46e-4501-ba6a-0dfe0e78b2ed	Tun	ntu06110@gmail.com	$2b$10$VJeAyr67uaCQgEU3V7jz3ucfgqdXeK6YzVmb8RSBPzHTfQ163gkye	nhan_vien	f	2025-12-01 22:02:46.484629	2025-12-01 22:03:51.069112	4948f87e-3033-4c98-8968-27021921b9f8
\.


--
-- Data for Name: phong_ban; Type: TABLE DATA; Schema: public; Owner: quyhung
--

COPY public.phong_ban (id, ten_phong_ban, ngay_tao, ngay_cap_nhat) FROM stdin;
4948f87e-3033-4c98-8968-27021921b9f8	Ban Kỹ Thuật	2025-12-01 21:58:13.742359	2025-12-01 21:58:13.742359
\.


--
-- Name: phong_ban PK_546e2f5bc3f05bebbc2fa3a19e9; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.phong_ban
    ADD CONSTRAINT "PK_546e2f5bc3f05bebbc2fa3a19e9" PRIMARY KEY (id);


--
-- Name: nguoi_dung PK_6c787389b1d841339cc2000bb81; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT "PK_6c787389b1d841339cc2000bb81" PRIMARY KEY (id);


--
-- Name: du_an PK_7d0e6729150b020e5044e807881; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT "PK_7d0e6729150b020e5044e807881" PRIMARY KEY (id);


--
-- Name: cong_viec PK_9918d52b19ed9756cfbc880321c; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.cong_viec
    ADD CONSTRAINT "PK_9918d52b19ed9756cfbc880321c" PRIMARY KEY (id);


--
-- Name: file_dinh_kem PK_9921b2396c1879bc550a895a75a; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.file_dinh_kem
    ADD CONSTRAINT "PK_9921b2396c1879bc550a895a75a" PRIMARY KEY (id);


--
-- Name: nguoi_dung UQ_2e80e311459160919913afd26c9; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT "UQ_2e80e311459160919913afd26c9" UNIQUE (email);


--
-- Name: phong_ban UQ_9c79e9a5760a7e183f05c15f2b6; Type: CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.phong_ban
    ADD CONSTRAINT "UQ_9c79e9a5760a7e183f05c15f2b6" UNIQUE (ten_phong_ban);


--
-- Name: cong_viec FK_00845997f82ccc71a0eeeb7e0ad; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.cong_viec
    ADD CONSTRAINT "FK_00845997f82ccc71a0eeeb7e0ad" FOREIGN KEY ("duAnId") REFERENCES public.du_an(id) ON DELETE CASCADE;


--
-- Name: du_an FK_026282c09697d5940be420c13db; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT "FK_026282c09697d5940be420c13db" FOREIGN KEY ("nguoiQuanLyId") REFERENCES public.nguoi_dung(id) ON DELETE SET NULL;


--
-- Name: cong_viec FK_28dd7f01ef4395ce3411626c905; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.cong_viec
    ADD CONSTRAINT "FK_28dd7f01ef4395ce3411626c905" FOREIGN KEY ("nguoiThucHienId") REFERENCES public.nguoi_dung(id) ON DELETE SET NULL;


--
-- Name: nguoi_dung FK_5023216d79dfa2d325b7d31aa81; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.nguoi_dung
    ADD CONSTRAINT "FK_5023216d79dfa2d325b7d31aa81" FOREIGN KEY ("phongBanId") REFERENCES public.phong_ban(id);


--
-- Name: cong_viec FK_8188933f97c2dc43bb540e69c0a; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.cong_viec
    ADD CONSTRAINT "FK_8188933f97c2dc43bb540e69c0a" FOREIGN KEY ("nguoiGiaoViecId") REFERENCES public.nguoi_dung(id) ON DELETE SET NULL;


--
-- Name: file_dinh_kem FK_92a6112547445d62a47de1f94d7; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.file_dinh_kem
    ADD CONSTRAINT "FK_92a6112547445d62a47de1f94d7" FOREIGN KEY ("congViecId") REFERENCES public.cong_viec(id) ON DELETE CASCADE;


--
-- Name: du_an FK_fba9c7ce08f98dc4f9751470b3a; Type: FK CONSTRAINT; Schema: public; Owner: quyhung
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT "FK_fba9c7ce08f98dc4f9751470b3a" FOREIGN KEY ("phongBanId") REFERENCES public.phong_ban(id);


--
-- PostgreSQL database dump complete
--

\unrestrict KeFKJmgIDftJBt767jFrkx3shoNd5pUf59QVbOHwDoV3BqIYBh0P8nXJRGFVjef

