import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler

gdp = pd.read_excel('gdplev.xls', header=None, skiprows=list(np.arange(0,8)), usecols=[4,6], names=['quarter', 'gdp'])

# Don't bother processing rows that don't have enough subsequent data to identify a recession.
def determine_should_process(x):
    return x.name >= len(gdp) - 4

def get_gdp_collection(x, n):
    if determine_should_process(x):
        return None
    index = x.name
    return gdp.loc[index:index + n, 'gdp'].values

gdp['gdp_collection'] = gdp.apply(get_gdp_collection, args=(9,), axis=1)

def get_gdp_collection_diffs(x):
    if determine_should_process(x):
        return None
    collection = x['gdp_collection']
    return np.around(collection[1:] - collection[:len(collection) - 1], decimals=2)

gdp['gdp_collection_diffs'] = gdp.apply(get_gdp_collection_diffs, axis=1)

def set_is_recession_start(x):
    if determine_should_process(x):
        return None
    return (x['gdp_collection_diffs'][0] < 0) & (x['gdp_collection_diffs'][1] < 0)

gdp['is_recession_start'] = gdp.apply(set_is_recession_start, axis=1)

def set_recession_end_quarter_rel_index(x):
    if determine_should_process(x):
        return None
    recession_end_quarter_rel_index = None
    if x['is_recession_start'] == True:
        for i in range(1, len(x['gdp_collection_diffs'])):
            if (x['gdp_collection_diffs'][i - 1] > 0) & (x['gdp_collection_diffs'][i] > 0):
                recession_end_quarter_rel_index = i + 1
                break
    return recession_end_quarter_rel_index

gdp['recession_end_quarter_rel_index'] = gdp.apply(set_recession_end_quarter_rel_index, axis=1)

def set_recession_end_quarter(x):
    recession_end_quarter = None

    if x['is_recession_start'] == True:
        recession_end_quarter = gdp.loc[x.name + x['recession_end_quarter_rel_index'], 'quarter']

    return recession_end_quarter

gdp['recession_end_quarter'] = gdp.apply(set_recession_end_quarter, axis=1)

def get_recession_end_gdp(x):
    recession_end_gdp = None
    if (x['is_recession_start'] == True):
        recession_end_gdp = gdp[gdp['quarter'] == x['recession_end_quarter']]['gdp'].item()
    return recession_end_gdp

gdp['recession_end_gdp'] = gdp.apply(get_recession_end_gdp, axis=1)

# Remove any recession starts that are actually part of a previously started recession.
def remove_false_recession_starts(df):
    for i in df[df['is_recession_start'] == True].index:
        x = df.loc[i]

        recession_end_index = gdp[gdp['quarter'] == x['recession_end_quarter']].index.values[0]
        rows_between = gdp.loc[x.name + 1:recession_end_index]
        gdp.loc[rows_between.index.values, 'is_recession_start'] = False

remove_false_recession_starts(gdp)

recessions = gdp[gdp['is_recession_start'] == True].copy().drop('is_recession_start', axis=1)
# Pare down column names.
recessions.rename(columns={
    'recession_end_quarter_rel_index': 'end_quarter_rel_index',
    'recession_end_quarter': 'end_quarter',
    'recession_end_gdp': 'end_gdp'
}, inplace=True)
# Make the relative index an integer for ease of use.
recessions['end_quarter_rel_index'] = recessions['end_quarter_rel_index'].apply(np.int64)

def remove_out_of_range_gdps(x):
    return x['gdp_collection'][:x['end_quarter_rel_index'] + 1]

recessions['gdp_collection'] = recessions.apply(remove_out_of_range_gdps, axis=1)

def remove_out_of_range_gdp_diffs(x):
    return x['gdp_collection_diffs'][:x['end_quarter_rel_index']]

recessions['gdp_collection_diffs'] = recessions.apply(remove_out_of_range_gdp_diffs, axis=1)

def get_bottom_gdp(x):
    return x['gdp_collection'].min()

recessions['bottom_gdp'] = recessions.apply(get_bottom_gdp, axis=1)

recessions['num_quarters'] = recessions.apply(lambda x: len(x['gdp_collection']), axis=1)

def get_initial_consecutive_decreases(x):
    consecutive_decreases = 0
    for i in range(0, len(x['gdp_collection_diffs'])):
        if x['gdp_collection_diffs'][i] < 0:
            consecutive_decreases += 1
        else:
            break;
    return consecutive_decreases

recessions['num_initial_consecutive_decreases'] = recessions.apply(get_initial_consecutive_decreases, axis=1)

# Calculate % decrease from start to bottom.
recessions['start_to_bottom'] = (recessions['gdp'] - recessions['bottom_gdp']) / recessions['gdp']
# Calculate % increase from bottom to end.
recessions['bottom_to_end'] = (recessions['end_gdp'] - recessions['bottom_gdp']) / recessions['bottom_gdp']

# Normalize data by scaling over range.
def normalize_column(df, column, feature_range=(0,1)):
    scaler = MinMaxScaler(feature_range=feature_range)
    values = df[[column]].values
    scaler.fit(values)

    return df.apply(lambda x: scaler.transform(x[column])[0][0], axis=1)

recessions['num_quarters_norm'] = normalize_column(recessions, 'num_quarters', (1,10))
recessions['start_to_bottom_norm'] = normalize_column(recessions, 'start_to_bottom', (1,10))
recessions['bottom_to_end_norm'] = normalize_column(recessions, 'bottom_to_end', (1,10))
recessions['num_initial_consecutive_decreases_norm'] = normalize_column(recessions, 'num_initial_consecutive_decreases', (1,5))

print(recessions[['gdp', 'bottom_gdp', 'end_gdp', 'num_quarters', 'num_initial_consecutive_decreases', 'num_initial_consecutive_decreases_norm']])

# Export to JSON
# recessions.to_json('recessions.json', orient='records')
