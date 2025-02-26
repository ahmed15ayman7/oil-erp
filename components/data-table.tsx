'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { JSX } from 'react';

interface Column {
  id: string;
  label: string;
  format?: (value: any) => string | JSX.Element;
}

interface Action {
  icon: JSX.Element;
  label: string;
  onClick: (row: any) => void;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  page: number;
  totalCount: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  additionalActions?: Action[];
}

export function DataTable({
  columns,
  data,
  loading = false,
  page,
  totalCount,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  additionalActions = [],
}: DataTableProps) {
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
    onPageChange(0);
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-4">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              {(onEdit || onDelete || additionalActions.length > 0) && (
                <TableCell>إجراءات</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.format
                      ? column.format(row[column.id])
                      : row[column.id]}
                  </TableCell>
                ))}
                {(onEdit || onDelete || additionalActions.length > 0) && (
                  <TableCell align="left">
                    <Box className="flex gap-1">
                      {additionalActions.map((action, index) => (
                        <Tooltip key={index} title={action.label}>
                          <IconButton
                            size="small"
                            onClick={() => action.onClick(row)}
                            className="text-primary hover:text-primary/90"
                          >
                            {action.icon}
                          </IconButton>
                        </Tooltip>
                      ))}
                      {onEdit && (
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(row)}
                            className="text-primary hover:text-primary/90"
                          >
                            <IconEdit size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            onClick={() => onDelete(row)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <IconTrash size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="عدد الصفوف:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} من ${count}`
        }
      />
    </Paper>
  );
}
