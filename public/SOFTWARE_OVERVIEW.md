# Niyantra - Intelligent Asset Management Software

## Overview
**Niyantra** is a comprehensive, web-based IT asset management solution designed to help modern enterprises track, manage, and optimize their hardware lifecycle. From acquisition to disposal, Niyantra ensures complete visibility and accountability for all your organization's assets.

## Key Features in Detail

### 1. Intelligent Asset Import
*   **CSV/Excel Integration**: Batch upload hundreds of assets using our standardized import template.
*   **Smart Date Parsing**: Automatically handles various date formats (`dd/mm/yyyy`, `mm/dd/yyyy`) and even Excel numeric serial dates.
*   **Auto-Calculations**: Automatically calculates warranty expiry based on acquisition date, or accepts manual overrides from the import file.
*   **Preview Mode**: Preview data before committing to the database to ensure accuracy.

### 2. Smart Asset Lifecycle & Transfers
*   **Real-time Custody**: Track exactly who has which asset (Stock, Assigned, In Repair, Scrapped).
*   **Audit-Ready Transfers**: Every movement between companies, branches, or locations is logged with a timestamp and reason.
*   **Bulk Actions**: Perform bulk deletions or updates to manage large inventories efficiently.

### 3. Multi-Entity Management
*   **Multi-Company Support**: Manage multiple legal entities within a single unified dashboard.
*   **Branch-Level Granularity**: Organize assets by specific branches and physical locations within those branches.
*   **Centralized Control**: Admins can oversee the entire organization's asset health from one view.

### 4. Data Recovery & Security (Recycle Bin)
*   **Soft-Delete Mechanism**: Assets are never truly lost. Deletion simply moves them to a "soft-deleted" state, preserving historical data.
*   **Admin Recycle Bin**: A dedicated interface for administrators to review deleted items.
*   **Restore & Permanent Delete**: Restore accidentally deleted assets with a single click or permanently purge them to comply with data policies.

## User Roles & Permissions

| Feature | Admin | Staff | Viewer |
| :--- | :---: | :---: | :---: |
| View Dashboard & Reports | ✓ | ✓ | ✓ |
| Add/Edit Assets | ✓ | ✓ | - |
| Asset Transfers | ✓ | ✓ | - |
| Bulk Actions | ✓ | ✓ | - |
| Master Data Mgmt (Companies, Brands) | ✓ | - | - |
| User Management | ✓ | - | - |
| **Recycle Bin & Data Recovery** | **✓** | - | - |
| Permanent Data Purging | ✓ | - | - |

## Business Impact & Cost Optimization

Niyantra is more than a tracking tool; it is a financial optimization engine for your IT department.

### 1. Eliminating "Ghost Assets"
Ghost assets are items on your books that are lost, stolen, or unusable but still incur costs (maintenance, insurance, software licenses). Niyantra’s real-time audit trail and soft-delete mechanism ensure your inventory matches reality, potentially **reducing insurance and licensing costs by 15-20%**.

### 2. Strategic Procurement & ROI
*   **Warranty Awareness**: By tracking warranty dates, the system ensures you never pay for a repair that the vendor should cover for free.
*   **Replacement Planning**: Use depreciation data to plan hardware refreshes proactively, avoiding emergency high-cost purchases and minimizing downtime.

### 3. Boosting Operational Efficiency
*   **Man-Hour Savings**: Automating the import and transfer process replaces error-prone spreadsheets, saving IT teams hundreds of hours per year.
*   **Centralized Visibility**: Reduce the "Search Time" for assets. Instantly locate hardware across any branch, reducing the need for duplicate "safety stock" purchases.

### 4. Compliance & Risk Mitigation
*   **Audit Readiness**: Stay compliant with financial regulations and security standards (like SOC2 or ISO 27001) effortlessly. Avoid the hefty fines and labor costs associated with manual audit preparation.

## Technology & Design
*   **Modern UI**: High-fidelity glassmorphism design with smooth animations and interactive components.
*   **Real-time Synced**: Powered by Firebase Firestore for instantaneous updates across all users.
*   **Responsive**: Optimized for desktops, tablets, and field-use on mobile devices.

---
*Powered by Digital Edge Technologies*
