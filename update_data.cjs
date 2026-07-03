const fs = require('fs');

const rawNodes = fs.readFileSync('parsed_nodes.json', 'utf8');

const defaultDataTemplate = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContactNode, ChartSettings } from './types';

export const DEFAULT_SETTINGS: ChartSettings = {
  chartName: "Sơ đồ Tổ chức Chức năng",
  chartDescription: "Sơ đồ khối Phòng Ban và Nhánh chức năng",
  layoutDirection: "TB",
  cardSize: "detailed",
  showRelationshipColors: true,
  showAvatars: true,
  primaryField: "name",
  secondaryField: "title",
  tertiaryField: "department",
  visibleFields: ["title", "department", "email", "relationship"],
  customFieldDefinitions: [
    {
      id: "english_title",
      label: "Chức Danh (Tiếng Anh)",
      type: "text"
    },
    {
      id: "workspace",
      label: "Khu vực Làm việc",
      type: "select",
      options: [
        "Sở Chỉ huy (Hà Nội)",
        "Văn phòng TP.HCM",
        "Chi nhánh Đà Nẵng",
        "Hệ thống Cửa hàng",
        "Làm việc từ xa"
      ]
    },
    {
      id: "years_at_company",
      label: "Thâm niên (Năm)",
      type: "number"
    }
  ],
  themeColor: "#2563eb",
  backgroundType: "white",
  connectorStyle: "smooth"
};

export const DEFAULT_NODES: ContactNode[] = ${rawNodes};
`;

fs.writeFileSync('src/defaultData.ts', defaultDataTemplate);
