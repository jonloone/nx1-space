import pandas as pd

# Read the file and check columns
df = pd.read_csv("data/raw/gcat_satcat.tsv", sep='\t', comment='#', low_memory=False, nrows=5)
print("Columns in GCAT file:")
print(df.columns.tolist())
print("\nFirst few rows:")
print(df.head())