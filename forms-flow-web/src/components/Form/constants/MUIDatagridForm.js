import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useTranslation } from "react-i18next";
import { push } from "connected-react-router";
import { setBPMFormLimit, setBPMFormListPage, setBpmFormSort } from "../../../actions/formActions";
import { resetFormProcessData } from "../../../apiManager/services/processServices";
import userRoles from "../../../constants/permissions";
import { HelperServices } from "@formsflow/service";
import { MULTITENANCY_ENABLED } from "../../../constants/constants";
// import { CustomButton }from "@formsflow/components";

function FormDataGrid() {
  const dispatch = useDispatch();
  const tenantKey = useSelector(state => state.tenants?.tenantId);
  const bpmForms = useSelector(state => state.bpmForms);
  const formData = bpmForms.forms || [];
  const pageNo = useSelector(state => state.bpmForms.formListPage);
  const limit = useSelector(state => state.bpmForms.limit);
  const totalForms = useSelector(state => state.bpmForms.totalForms);
  const formsort = useSelector(state => state.bpmForms.sort);
  const searchFormLoading = useSelector(state => state.formCheckList.searchFormLoading);
  const isApplicationCountLoading = useSelector(state => state.process.isApplicationCountLoading);
  const { createDesigns, viewDesigns } = userRoles();
  const { t } = useTranslation();
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  // Mapping between DataGrid field names and reducer sort keys
  const gridFieldToSortKey = {
    title: "formName",
    modified: "modified",
    anonymous: "visibility",
    status: "status",
  };

  const sortKeyToGridField = {
    formName: "title",
    modified: "modified",
    visibility: "anonymous",
    status: "status",
  };

  // Prepare DataGrid columns
  const columns = [
    {
      field: "title",
      headerName: t("Name"),
      flex: 1,
      sortable: true,
    },
    {
      field: "description",
      headerName: t("Description"),
      flex: 2,
      sortable: false,
      renderCell: params => (
        <span>
          {params.row.description ? (new DOMParser().parseFromString(params.row.description, 'text/html').body.textContent) : ""}
        </span>
      )
    },
    {
      field: "modified",
      headerName: t("Last Edited"),
      flex: 1,
      sortable: true,
      renderCell: params => HelperServices.getLocaldate(params.row.modified),
    },
    {
      field: "anonymous",
      headerName: t("Visibility"),
      flex: 1,
      sortable: true,
      renderCell: params => params.value ? t("Public") : t("Private"),
    },
    {
      field: "status",
      headerName: t("Status"),
      flex: 1,
      sortable: true,
      renderCell: params => (
        <span>
          {params.value === "active" ?
            <span className="status-live"></span> :
            <span className="status-draft"></span>}
          {params.value === "active" ? t("Live") : t("Draft")}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "",
      flex: 1,
      sortable: false,
      renderCell: params => (
        (createDesigns || viewDesigns) && (
          <button
            onClick={() => {
              dispatch(resetFormProcessData());
              dispatch(push(`${redirectUrl}formflow/${params.row._id}/edit`));
            }}
            aria-label={`${createDesigns ? "Edit" : "View"} Form Button`}
          >
            {createDesigns ? t("Edit") : t("View")}
          </button>
        )
      )
    },
  ];

  // DataGrid event handlers, mirroring your Redux updates
//   const handlePageChange = (params) => {
//     dispatch(setBPMFormListPage(params.page + 1));
//   };
  const handlePageChange = (page) => {
    dispatch(setBPMFormListPage(page));
  };
  
  const handleSortChange = (modelArray) => {
    const model = Array.isArray(modelArray) ? modelArray[0] : modelArray;
    if (!model || !model.field || !model.sort) {
      //TBD : we can use helper service here later 
      const resetSort = Object.keys(formsort).reduce((acc, key) => {
        acc[key] = { sortOrder: "asc" };
        return acc;
      }, {});
      dispatch(setBpmFormSort({ ...resetSort, activeKey: "formName" }));
      dispatch(setBPMFormListPage(1)); 
      return;
    }

    const mappedKey = gridFieldToSortKey[model.field] || model.field;
    const order = model.sort; 

    const updatedSort = Object.keys(formsort).reduce((acc, columnKey) => {
      acc[columnKey] = { sortOrder: columnKey === mappedKey ? order : "asc" };
      return acc;
    }, {});

    dispatch(setBpmFormSort({ ...updatedSort, activeKey: mappedKey }));
  };
  

  const handleLimitChange = (limitVal) => {
    dispatch(setBPMFormLimit(limitVal));
    dispatch(setBPMFormListPage(1));
  };

//   // MUI Detail Panel: for expandable row
//   const getDetailPanelContent = React.useCallback((params) => (
//     <div style={{ padding: 16 }}>
//       <div>{t("Description")}: {params.row.description ? (new DOMParser().parseFromString(params.row.description, 'text/html').body.textContent) : ""}</div>
//       {/* add other expanded details if needed */}
//     </div>
//   ), [t]);
  
  const activeKey = bpmForms.sort?.activeKey || "formName";
  const activeField = sortKeyToGridField[activeKey] || activeKey;
  const activeOrder = bpmForms.sort?.[activeKey]?.sortOrder || "asc";
  const onPaginationModelChange = ({ page, pageSize }) => {
    if (limit !== pageSize) handleLimitChange(pageSize);
    else if ((pageNo - 1) !== page) handlePageChange(page + 1);
  };
  const rows = React.useMemo(() => {
    return (formData || []).map((f) => ({
      ...f,
      id: f._id || f.path || f.name,
    })).filter(r => r.id);
  }, [formData]);
  const paginationModel = React.useMemo(
    () => ({ page: pageNo - 1, pageSize: limit }),
    [pageNo, limit]
  );
  
  return (
    <Paper sx={{ height: 550, width: "100%" }}>
      <DataGrid
       //disableColumnResize // disabed resizing
        columns={columns}
        rows={rows}
        rowCount={totalForms}
        loading={searchFormLoading || isApplicationCountLoading}
        paginationMode="server"
        sortingMode="server"
        disableColumnMenu
        sortModel={[{ field: activeField, sort: activeOrder }]}
        onSortModelChange={handleSortChange}
        paginationModel={paginationModel}
        getRowId={(row) => row.id}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </Paper>
  );
}

export default FormDataGrid;
