import pandas as pd
import numpy as np

gdp = pd.read_excel('gdplev.xls', header=None, skiprows=list(np.arange(0,8)), usecols=[4,6], names=['quarter', 'gdp'])

# Don't bother processing rows that don't have enough subsequent data to identify a recession.
def determine_should_process(x):
    return x.name >= len(gdp) - 4

def get_next_gdps(x, n):
    if determine_should_process(x):
        return None
    index = x.name
    return gdp.loc[index:index + n, 'gdp'].values

gdp['next_gdps'] = gdp.apply(get_next_gdps, args=(9,), axis=1)

def get_next_gdps_diffs(x):
    if determine_should_process(x):
        return None
    nexts = x['next_gdps']
    return np.around(nexts[1:] - nexts[:len(nexts) - 1], decimals=2)

gdp['next_gdps_diffs'] = gdp.apply(get_next_gdps_diffs, axis=1)

def set_is_recession_start(x):
    if determine_should_process(x):
        return None
    return (x['next_gdps_diffs'][0] < 0) & (x['next_gdps_diffs'][1] < 0)

gdp['is_recession_start'] = gdp.apply(set_is_recession_start, axis=1)

def set_recession_end_quarter(x):
    if determine_should_process(x):
        return None
    recession_end_quarter = None
    if x['is_recession_start'] == True:
        for i in range(1, len(x['next_gdps_diffs'])):
            if (x['next_gdps_diffs'][i - 1] > 0) & (x['next_gdps_diffs'][i] > 0):
                recession_end_quarter = gdp.loc[x.name + i + 1, 'quarter']
                break
    return recession_end_quarter

gdp['recession_end_quarter'] = gdp.apply(set_recession_end_quarter, axis=1)

def get_recession_end_value(x):
    recession_end_value = None
    if (x['is_recession_start'] == True):
        recession_end_value = gdp[gdp['quarter'] == x['recession_end_quarter']]['gdp'].item()
    return recession_end_value

gdp['recession_end_value'] = gdp.apply(get_recession_end_value, axis=1)

# Remove any recession starts that are actually part of a previously started recession.
def remove_false_recession_starts(df):
    for i in df[df['is_recession_start'] == True].index:
        x = df.loc[i]

        recession_end_index = gdp[gdp['quarter'] == x['recession_end_quarter']].index.values[0]
        rows_between = gdp.loc[x.name + 1:recession_end_index]
        gdp.loc[rows_between.index.values, 'is_recession_start'] = False

remove_false_recession_starts(gdp)

recessions = gdp[gdp['is_recession_start'] == True].copy().drop('is_recession_start', axis=1)

print(recessions)
