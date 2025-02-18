import * as React from 'react';
// @ts-ignore Remove once the test utils are typed
import { createRenderer, fireEvent, act } from '@mui/monorepo/test/utils';
import { getColumnHeaderCell, getRow } from 'test/utils/helperFn';
import { expect } from 'chai';
import {
  DataGridPro,
  DataGridProProps,
  GridApi,
  GridColumns,
  GridRowModel,
  GridRowsProp,
  useGridApiRef,
} from '@mui/x-data-grid-pro';
import { spy } from 'sinon';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<DataGridPro /> - Lazy loader', () => {
  const { render } = createRenderer();

  const baselineProps: { rows: GridRowsProp; columns: GridColumns } = {
    rows: [
      {
        id: 1,
        first: 'Mike',
      },
      {
        id: 2,
        first: 'Jack',
      },
      {
        id: 3,
        first: 'Jim',
      },
    ],
    columns: [{ field: 'id' }, { field: 'first' }],
  };

  let apiRef: React.MutableRefObject<GridApi>;

  const TestLazyLoader = (props: Partial<DataGridProProps>) => {
    apiRef = useGridApiRef();
    return (
      <div style={{ width: 300, height: 300 }}>
        <DataGridPro
          experimentalFeatures={{
            lazyLoading: true,
          }}
          apiRef={apiRef}
          {...baselineProps}
          {...props}
          sortingMode="server"
          filterMode="server"
          rowsLoadingMode="server"
        />
      </div>
    );
  };

  it('should not call onFetchRows if the viewport is fully loaded', function test() {
    if (isJSDOM) {
      this.skip(); // Needs layout
    }
    const handleFetchRows = spy();
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }];
    render(<TestLazyLoader onFetchRows={handleFetchRows} rowCount={50} rows={rows} />);
    expect(handleFetchRows.callCount).to.equal(0);
  });

  it('should call onFetchRows when sorting is applied', function test() {
    if (isJSDOM) {
      this.skip(); // Needs layout
    }
    const handleFetchRows = spy();
    render(<TestLazyLoader onFetchRows={handleFetchRows} rowCount={50} />);

    expect(handleFetchRows.callCount).to.equal(1);
    // Should be 1. When tested in the browser it's called only 2 time
    fireEvent.click(getColumnHeaderCell(0));
    expect(handleFetchRows.callCount).to.equal(2);
  });

  it('should render skeleton cell if rowCount is bigger than the number of rows', function test() {
    if (isJSDOM) {
      this.skip(); // Needs layout
    }

    render(<TestLazyLoader rowCount={10} />);

    // The 4th row should be a skeleton one
    expect(getRow(3).dataset.id).to.equal('auto-generated-skeleton-row-root-0');
  });

  it('should update all rows accordingly when `apiRef.current.unstable_replaceRows` is called', () => {
    render(<TestLazyLoader rowCount={6} />);

    const newRows: GridRowModel[] = [
      { id: 4, name: 'John' },
      { id: 5, name: 'Mac' },
    ];

    const initialAllRows = apiRef.current.state.rows.ids;
    expect(initialAllRows.slice(3, 6)).to.deep.equal([
      'auto-generated-skeleton-row-root-0',
      'auto-generated-skeleton-row-root-1',
      'auto-generated-skeleton-row-root-2',
    ]);
    act(() => apiRef.current.unstable_replaceRows(4, newRows));

    const updatedAllRows = apiRef.current.state.rows.ids;
    expect(updatedAllRows.slice(4, 6)).to.deep.equal([4, 5]);
  });

  it('should update all rows accordingly when `apiRef.current.unstable_replaceRows` is called and props.getRowId is defined', () => {
    render(
      <TestLazyLoader
        rowCount={6}
        getRowId={(row) => row.clientId}
        rows={[
          {
            clientId: 1,
            first: 'Mike',
          },
          {
            clientId: 2,
            first: 'Jack',
          },
          {
            clientId: 3,
            first: 'Jim',
          },
        ]}
        columns={[{ field: 'clientId' }]}
      />,
    );

    const newRows: GridRowModel[] = [
      { clientId: 4, name: 'John' },
      { clientId: 5, name: 'Mac' },
    ];

    const initialAllRows = apiRef.current.state.rows.ids;
    expect(initialAllRows.slice(3, 6)).to.deep.equal([
      'auto-generated-skeleton-row-root-0',
      'auto-generated-skeleton-row-root-1',
      'auto-generated-skeleton-row-root-2',
    ]);
    act(() => apiRef.current.unstable_replaceRows(4, newRows));

    const updatedAllRows = apiRef.current.state.rows.ids;
    expect(updatedAllRows.slice(4, 6)).to.deep.equal([4, 5]);

    expect(apiRef.current.getRowNode(4)).to.not.equal(null);
    expect(apiRef.current.getRowNode(5)).to.not.equal(null);
  });
});
