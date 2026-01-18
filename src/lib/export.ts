'use client';

import type { Attendee } from './types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function exportToCsv(attendees: Attendee[], sessionTitle: string) {
  if (attendees.length === 0) {
    alert('Tidak ada data peserta untuk diekspor.');
    return;
  }

  const headers = ['Nama Lengkap', 'Jurusan/Jabatan', 'NIM/NIP', 'Jam Datang'];
  const rows = attendees.map(att => [
    `"${att.name}"`,
    `"${att.department}"`,
    `"${att.studentId}"`,
    `"${format(new Date(att.arrivalTime), 'd MMMM yyyy, HH:mm:ss', { locale: id })}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows
  ].join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const fileName = `kehadiran_${sessionTitle.replace(/\s+/g, '_').toLowerCase()}.csv`;
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function exportToPdf(attendees: Attendee[], sessionTitle: string) {
    if (attendees.length === 0) {
      alert('Tidak ada data peserta untuk diekspor.');
      return;
    }
  
    const doc = new jsPDF() as jsPDFWithAutoTable;
  
    doc.setFontSize(18);
    doc.text(`Data Kehadiran: ${sessionTitle}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Diekspor pada: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: id })}`, 14, 30);
  
    const tableColumn = ['No', 'Nama Lengkap', 'Jurusan/Jabatan', 'NIM/NIP', 'Jam Datang'];
    const tableRows: (string | number)[][] = [];
  
    attendees.forEach((att, index) => {
      const attendeeData = [
        index + 1,
        att.name,
        att.department,
        att.studentId,
        format(new Date(att.arrivalTime), 'HH:mm:ss', { locale: id })
      ];
      tableRows.push(attendeeData);
    });
  
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      headStyles: {
        fillColor: [221, 75, 57] // A red tone similar to the theme
      },
      theme: 'grid'
    });
  
    const fileName = `kehadiran_${sessionTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    doc.save(fileName);
  }
