# Wolvesville Sprint 04 — Rule Source Inventory

**Trạng thái:** source-grounded; không dùng LPTV, artwork/prototype hoặc fixture làm nguồn luật. Bản v0.5.1 được sao chép nguyên cấu trúc; không viết lại Kernel. Truy cập thực tế đã xác minh trên các bản sao cục bộ.

## Bộ nguồn cốt lõi

- `data/character.json`: **97 nhân vật**; SHA256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`. Trùng checksum chính thức đã chốt.
- `data/rules/official_merged_118.json`: **118 quyết định** gồm 85 VH + 21 quyết định v1.2 + 12 Q13 v1.3.1.
- `data/rules/skills.json`: **145 nhánh kiểm kê**, có cả nhãn composite/kỹ thuật; không coi chúng là 145 kỹ năng nguyên tử đã xác nhận.
- `data/rules/tests_207.json`: **207 test specification**, KHÔNG được tính là 207 test Engine đã chạy. 155 bản ghi dùng `run_status`, 52 bản ghi dùng `execution_status`; cả hai đều ghi `SPEC_ONLY_NOT_EXECUTED`.
- `data/rules/findings.json`: **22 phát hiện kiểm toán**, dùng để khoanh vùng, không tự nâng thành quyết định mới.
- `reference/official_rule_sources_v1_3_1/`: bản sao tài liệu DOCX VH01–VH85 và đặc tả nguồn, cùng các hồ sơ Q13 để kiểm toán độc lập. Bản DOCX VH trực tiếp có đủ **85** mã VH theo kiểm tra văn bản.
- `reference/approved_frontend_original/`: thiết kế tham chiếu; **chỉ sử dụng làm nguồn UI**, không làm nguồn luật.

## SHA nguồn trong gói hiện hành

| Nguồn | Truy xuất | SHA-256 (đầu) |
| --- | --- | --- |
| data/character.json | True | 7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3 |
| data/rules/official_merged_118.json | True | 3bd590000aedbe46f5a5a62e43e18c5d247cb3d401ba60f980a050512e8376f3 |
| data/rules/vh01_vh85_UNCHANGED.json | True | b7cc91af9a5406d415b5b3a72b56df023b4ce71338d45ad69d615ff9ce4d95a2 |
| data/rules/decisions_21_v1_2_UNCHANGED.json | True | 42bf24218e3b6c3777c0a315d82d48e93bd0c0184587968b248be52fbd2a5d56 |
| data/rules/q13_12_user_confirmed.json | True | e8814132695962a9644bcbb56576c3ee77d1f4ba2ad98f95df87b8f2062ece65 |
| data/rules/skills.json | True | 0658126f8f897178989c1a7c79edcd8feaff5a19f3408a82355702300aece116 |
| data/rules/tests_207.json | True | 0a6edd6b086ebe270519493c83a48d73113a80ffff3528aada51282d8f4a1860 |
| data/rules/findings.json | True | 9d1ed3378b6fe47cd7d6a852a061e8c2ec1d3eba314222306cb2d56da1d72c8b |
| docs/FINAL_HARDENING_KNOWN_LIMITATIONS.md | True | 06ba55303d7058e028a36b1f716538ede1b344371a2f9cb57f2758ce9127fb63 |
| backend/src/engine/service.ts | True | 251a21ec08724eeab253ba517cb53e43a0c71166205b7ec2a33fe6319ce015ed |
| backend/src/official/inspection-rules.ts | True | 3139898931c2029f3837c939b72092743107d91584acb76c9b84cf06496bd603 |
| backend/src/official/reactive-rules.ts | True | b202899a62efefb9208d5f518ddfa252df15af9a09b26e5696da945fb8c752c9 |
| tests/official-rules.test.mjs | True | d6f65565afc08cb96a10a786cd250be1dcd87259c19199b8bd166f994cbb2270 |
| tests/official-reactive.test.mjs | True | fb4faac76bbe94181484b5756b3d976fe9ad73d3a7a067c6111303314753fa7e |
| reference/official_rule_sources_v1_3_1/Wolvesville_Bao_cao_tong_hop_quyet_dinh_VH01-VH85.docx | True | 24824a3ae7a3b1ddf03ac9e58e5bd60d0ecf23b30affea6c6cd42bc5475b4948 |
| reference/official_rule_sources_v1_3_1/Wolvesville_Dac_ta_day_du_QA_Luong_he_thong_VH01-VH85.md | True | e52b72cfeb4d95a9851fd39c0ac719e4c393217a22008241f05b6f026e731b8d |
| reference/official_rule_sources_v1_3_1/01_SO_QUYET_DINH_V1_3_1.md | True | 5bc5d9c95949187277a124f8ede32387e6ec8a2e35e5602d15fc46f26ccdac77 |
| reference/official_rule_sources_v1_3_1/02_AUDIT_MAU_THUAN.md | True | 39cc1a52f644499d73a46c11be697cd6388d9db396a4c5fd53107959230c4fd4 |
| reference/official_rule_sources_v1_3_1/03_GAME_ENGINE_DELTA.md | True | 6d7287032faac4a5e9a906756978892b80e59a8f4fd18dcba486fa40cd0fb844 |


## Giới hạn nguồn

Các bài kiểm tra và hồ sơ có thể dẫn `QA`, `SYS`, `P05`, `SMU` nhưng **không mặc nhiên là quyết định thuộc sổ 118**; nếu không có đối chiếu rõ thì chỉ ghi là tham chiếu kiểm toán. Không dùng số thứ tự NV của Excel như Character ID JSON. Tài liệu/ảnh dự án khác hoặc các URL không truy xuất trong workspace không được giả định đã kiểm chứng.
