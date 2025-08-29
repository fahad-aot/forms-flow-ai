import React, { useEffect, useCallback, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import {  useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { push } from "connected-react-router";

import { CustomButton, CustomSearch } from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../../../constants/constants";
import { fetchAllProcesses } from "../../../apiManager/services/processServices";

import {
  setBpmnSearchText,
  setDmnSearchText,
  setBpmSort,
  setDmnSort,
  setIsPublicDiagram,
} from "../../../actions/processActions";

const columns = [
  { id: "name", label: "Name" },
  { id: "processKey", label: "ID" },
  { id: "modified", label: "Last Edited" },
  { id: "status", label: "Status" },
];

const ProcessTableMui = () => {
  const { viewType } = useParams();
  const isBPMN = viewType === "subflow";
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const processList = useSelector((state) =>
    isBPMN ? state.process.processList : state.process.dmnProcessList
  );
  const searchTextBPMN = useSelector((state) => state.process.bpmnSearchText);
  const searchTextDMN = useSelector((state) => state.process.dmnSearchText);
  const totalCount = useSelector((state) =>
    isBPMN ? state.process.totalBpmnCount : state.process.totalDmnCount
  );
  const tenantKey = useSelector((state) => state.tenants?.tenantId);
  const sortConfig = useSelector((state) =>
    isBPMN ? state.process.bpmsort : state.process.dmnSort
  );
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const [searchValue, setSearchValue] = useState(
    isBPMN ? searchTextBPMN : searchTextDMN
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchProcesses = useCallback(() => {
    setLoading(true);
    dispatch(
      fetchAllProcesses(
        {
          pageNo: page + 1,
          tenant_key: tenantKey,
          processType: isBPMN ? "BPMN" : "DMN",
          limit: rowsPerPage,
          searchKey: searchValue.trim(),
          sortBy: sortConfig.activeKey,
          sortOrder: sortConfig[sortConfig.activeKey]?.sortOrder,
        },
        () => {
          setLoading(false);
          setSearchLoading(false);
        }
      )
    );
  }, [dispatch, page, rowsPerPage, tenantKey, isBPMN, searchValue, sortConfig]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleSearch = () => {
    setSearchLoading(true);
    if (isBPMN) {
      dispatch(setBpmnSearchText(searchValue));
    } else {
      dispatch(setDmnSearchText(searchValue));
    }
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    if (isBPMN) {
      dispatch(setBpmnSearchText(""));
    } else {
      dispatch(setDmnSearchText(""));
    }
    setPage(0);
  };

  const handleSort = (key) => {
    const newSortOrder = sortConfig[key]?.sortOrder === "asc" ? "desc" : "asc";
    const action = isBPMN ? setBpmSort : setDmnSort;
    dispatch(
      action({
        ...Object.fromEntries(
          columns.map((col) => [col.id, { sortOrder: "asc" }])
        ),
        activeKey: key,
        [key]: { sortOrder: newSortOrder },
      })
    );
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const gotoEdit = (data) => {
    if (MULTITENANCY_ENABLED) {
      dispatch(setIsPublicDiagram(!!data.tenantId));
    }
    dispatch(
      push(
        `${redirectUrl}${viewType}/edit/${data.processKey}`
      )
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ mb: 2, width: "100%" }}>
        <Box sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <CustomSearch
            search={searchValue}
            setSearch={setSearchValue}
            handleSearch={handleSearch}
            handleClearSearch={handleClearSearch}
            placeholder={t(`Search ${isBPMN ? "BPMN" : "DMN"} Name`)}
            searchLoading={searchLoading}
            title={t(`Search ${isBPMN ? "BPMN" : "DMN"} Name`)}
            dataTestId="process-search-input"
          />
          <CustomButton
            label={t(`New ${isBPMN ? "BPMN" : "DMN"}`)}
            // onClick={} add create handler here
            dataTestid={`create-${isBPMN ? "bpmn" : "dmn"}-button`}
            ariaLabel={`Create ${isBPMN ? "BPMN" : "DMN"}`}
            action
          />
        </Box>

        <TableContainer sx={{ maxWidth: "100%",maxHeight:500 }}>
          <Table stickyHeader size="medium">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    sortDirection={
                      sortConfig.activeKey === col.id
                        ? sortConfig[col.id]?.sortOrder
                        : false
                    }
                  >
                    <TableSortLabel
                      active={sortConfig.activeKey === col.id}
                      direction={
                        sortConfig.activeKey === col.id
                          ? sortConfig[col.id]?.sortOrder || "asc"
                          : "asc"
                      }
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ width: 110 }}>
                  {t("Edit")}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && processList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center">
                    {t("No data found.")}
                  </TableCell>
                </TableRow>
              ) : (
                processList.map((row) => (
                  <TableRow key={row.id} hover>
                    {columns.map((col) => (
                      <TableCell key={col.id}>{row[col.id]}</TableCell>
                    ))}
                    <TableCell align="center">
                      <CustomButton
                        label={t("Edit")}
                        onClick={() => gotoEdit(row)}
                        dataTestid={`edit-button-${row.id}`}
                        ariaLabel={`Edit ${row.name}`}
                        size="small"
                        action
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default ProcessTableMui;
