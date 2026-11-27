from pathlib import Path
import json
import datetime as dt
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
root = Path(__file__).resolve().parents[1] / "labs/rebuilt-athlete"
data = json.loads((root / "fitness-growth.json").read_text())
rows = data["observations"]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,'axes.spines.right':False,'axes.spines.left':False,'axes.spines.bottom':False,'figure.facecolor':'#F2EDE2','axes.facecolor':'#F2EDE2','text.color':'#15130F','axes.labelcolor':'#15130F','xtick.color':'#39352D','ytick.color':'#39352D','svg.fonttype':'none'})
fig,axs=plt.subplots(2,1,figsize=(10,7),sharex=True)
x=[dt.date.fromisoformat(r[0]) for r in rows]
for ax,idx,title in [(axs[0],2,'Pace / mile'),(axs[1],3,'Average heart rate · bpm')]:
 ax.scatter(x,[r[idx] for r in rows],s=70,color='#2E5E8E',zorder=3)
 ax.set_title(title,loc='left',fontsize=15,fontweight='bold',pad=15)
 ax.grid(axis='y',alpha=.18);ax.tick_params(length=0)
 if idx==2:
  ax.invert_yaxis();ax.yaxis.set_major_formatter(FuncFormatter(lambda v,p:f'{int(v)//60}:{int(v)%60:02}'))
 else:
  for k in [0,2,5,6,8]:ax.annotate(str(rows[k][idx]),(x[k],rows[k][idx]),xytext=(0,10),textcoords='offset points',ha='center')
axs[1].set_xticks([dt.date(2026,9,25),dt.date(2026,10,9),dt.date(2026,10,31),dt.date(2026,11,25)],['Sep 25','Oct 9','Oct 31','Nov 25'])
fig.suptitle('Faster running. Lower recorded heart rate.',x=.1,ha='left',fontsize=21,fontweight='bold')
fig.text(.1,.025,'Selected outings, different distances and intentions. Dots are observations, not a fitted growth curve.\nSources: Garmin screenshots, summaries and dated FORM receipts. Device/sensor consistency unconfirmed.',fontsize=10)
fig.subplots_adjust(left=.1,right=.96,top=.86,bottom=.14,hspace=.35)
fig.savefig(root/'charts/fitness-observed.svg');fig.savefig(root/'charts/fitness-observed.png',dpi=160);plt.close(fig)
fig,ax=plt.subplots(figsize=(10,6))
base=dt.date(2026,11,26)
ax.scatter([base],[376],color='#15130F',s=80,label='Nov 26 observed work mean',zorder=4)
for date,lo,hi in [('2027-01-01',370,385),('2027-02-05',360,380),('2027-04-16',350,370)]:
 x=dt.date.fromisoformat(date)
 ax.plot([x,x],[lo,hi],color='#2E5E8E',linewidth=20,alpha=.35,solid_capstyle='butt')
 ax.text(x,hi+4,f'{lo//60}:{lo%60:02}–{hi//60}:{hi%60:02}',ha='center',fontsize=11,fontweight='bold')
h=data['athlete_hypothesis']
hx=[base+dt.timedelta(weeks=w) for w in h['weeks']]
ax.plot(hx,h['pace_seconds'],color='#9E2920',linestyle='--',marker='o',label='Your hypothesis: regain, then reassess in the 5:50s')
ax.fill_between([hx[2],hx[-1]],350,359,color='#9E2920',alpha=.12)
ax.annotate('5:50s · reassess here', (hx[-1],355),xytext=(12,-12),textcoords='offset points',fontsize=11,color='#9E2920')
ax.axhline(376,color='#514B40',linestyle=':',label='Same pace can still become easier')
ax.set_ylim(401,338)
ax.set_xlim(base-dt.timedelta(days=8),dt.date(2027,5,1))
ax.set_xticks([base,dt.date(2026,12,24),dt.date(2027,2,5),dt.date(2027,4,16)],['Nov 26','Dec 24','Feb 5','Apr 16'])
ax.yaxis.set_major_formatter(FuncFormatter(lambda v,p:f'{int(v)//60}:{int(v)%60:02}'))
ax.set_ylabel('Pace / mile');ax.grid(axis='y',alpha=.15);ax.tick_params(length=0)
ax.set_title('Your return hypothesis. Two possible paths.',loc='left',fontsize=21,fontweight='bold',pad=25)
ax.legend(loc='lower right',frameon=False,fontsize=10)
fig.text(.1,.04,'Blue bars: assistant judgement ranges for similar eight-minute efforts, not probability intervals.\nRed: your regain-then-plateau hypothesis. Timing and former level are not independently confirmed.\nPace gains may slow or stall; effort, duration, recovery and conditions must stay comparable.',fontsize=10)
fig.subplots_adjust(left=.1,right=.96,top=.84,bottom=.22)
fig.savefig(root/'charts/fitness-outlook.svg');fig.savefig(root/'charts/fitness-outlook.png',dpi=160);plt.close(fig)
