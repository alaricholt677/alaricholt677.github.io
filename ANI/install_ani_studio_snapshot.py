"""ANI Studio snapshot installer generated from installed AppData source."""
from __future__ import annotations

import base64
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import traceback
import winreg
import zlib
from pathlib import Path

PAYLOAD = 'c-q~4i+0;Mvf!_9(x-=H8&)Lw5l3qF9mjDJ?<9U_vNN`i4kb|*ClaZUlpo1vzkTZgfB;3wcDnn{o_nXSBjQnb6{-q_s=~Kt(Ooo{7ire$hsCpw^XzZYV4OPXXmpw6Q87se;l$Zb!u}-Mzbm37kJBV~UdK76ypAT}eKg#^n}w7?Rh-Lbr$<NU!O!oH_IBUz9v{EnJ>UKL@^bg^;7vS<c4xE8XR09N20vqI$nVDq73!T8^I@F!j<dAaZnn338x81VS?B%HTU}?8UgwvWdI<1|<>HZ(q=ggR#W_~63O{qE!^O1UlKI4G<KM;F(8r&l$aPwz&M-|PDgo*Lw{`g}2%x=Zj(3?jPF{o=R)Fv4eWT)Uzrk<lH2!Y?_Se>B;yckKk5<=OU!SDmaD4<bMvaYH^`I`34tFX_hO}7l>n<)3So1P@CY)#CY}T0F<I;|@bn5haqj@pUqF&F5r?V6q4-*(~Sm46K*koFEJqxou63(EwpGCQF#$i65#C_rXJ5LkgOv7R<oD?$h@w|v9@NbdL2L=2)@6WPy5apP64}XeiI>T`YXP!*}L_<QBUs?2J9_3JRK97gOxs8)7x)#pYm?~W+)azkbgo8<#=TWY@t&@Z^ilfO;mYhMy0IVu?44*RR`2M8WR_Q0j+j(qeG){`WG>dfptNS9_&9d-boV=QkMo}hC4vt<&H}N16C&y`=6yoGGf&rhL#a|%_ew@csC^ozQQk=!tNjQOWSvrfd;(izAm1bC+?1y=rT<^`Zo2b$}bV#?pmrhb>5sKyb@4*189!$e)Y&?X<u|LNVBp%0i({KijXRrrHX*R7u{S*(cqe9QxFPF)yj|cBx_YPhME^e<z^JSy8vp$WI`TF%Z&5QNHBnp%HZ2e}#?K-$aUD%Zl?@9+o1gW&aacaFZZ$!yWoTW(vn(<t7)4KwTG{)&P@_gTa?v^9~VC=nl8z7wLF6`?9<|J<*YC+Dc-MznmJeHXQnu1<G9DJV7xWr}hdjHMt$M@&KH+KM70Gqf6$mDk1aZ$|j&hzKtB+O!<W0PY0#f!#uT#V=aMw~u}4m^*OVRXlUggZ=c6WnM$L>spQIP4jHe(t`O`MFEI2Xq>I&Rt))h}4xzo<ek-3H&{bGfxhiXYV)z{E2P}KsXpgNdbNS=|yX2Fd9K;ig7fJAmu|mOycWt;k-rkhK%bh9=e_LY#u>9g-W?f;i=)T@0ZEx(fj?g;KFkOd(&H}eF#VaMEoq80J^$>sSQS}vvD|!8dQoCeBrt8qR9;E;6KZ1d>V&Eem;)#vKFl984@yBMX3BK%|62~Cr+GK(6{R>ohQQuFt6tMeF@=H7(+`gCN4Gzd1cAHEY0(A7-vu%CUg)Z=ULWQDqPk*col_HsCORS70aqnnX<~^C)j2<BVjVU&0-$n>Q)X@DE~1DZ^C$jY;vLen>6dk!(o(^b&!Z0o<Y5T0KJHj>7GV8q%G9Nf>6e;`Dq_}m}c?UG$~fsg;JGPKb>Li*Kv5ACc3WEs;&J7i&g6HpM9#S->$9yYO((AWCGPcq&M~bh3vBY$C*Ov-3gGuBrKw3%P5N)m>nV#y6@xU^RhZb)?tCMsH}K(3FKnr3`W<U-vNd_3?%Jo4AR-X2mIG5vir`kF`ofLiaew%4Wbwx5IA6NKwApHHZMvB=@4KC?z|YS@3=q^p>A|Hh-QVePyYZOcV@8TAzca~Lnf*wk@Gvl3oGGD^{A2zP_hU(J@lE!kcT%>4+k>zJ4jm_)6YnufExoL$^#-MB=z*t&-CSYaR`X?5s!feH=Ivrxi=I@N0TCG`(j~ea?Zx{<g-_V*8*9!-;uq6gf*5GKoA&w_S|0&Trr6fk4pJ#_|KZxcP}rSF3y9_`fH2jroO9Mm?hU<Jf(H%2PMb${O*@Pa&4~<9}VEbiKqE@;|M-Kq{HaVB)o2X!tos?lY76M_juaC+48;si8*`=bDo7UwET~7GLQBFtuhbO9W`)g1Uo$%Vz<<s_n|X6G%lw?GO<b8hYpKzTF6ez5p-{ZCbkXj-o`^<CH`+gduyA=TPAkLy4W~E4pA+qQoFJj_B_9P_s$hf(H1SgvI4K*|K7bjfQ7gfV<^(ZE;jBwpZ<jjr3LEyqTTk_`o{9+v@~J{f*=T>G^pD#%B+yGw)1NMiI|3q9$?7}Nbg|Y=2bTdWGChccB6-43uA+Vxwh$FG_Sg0K+wAVAY4lj8cad|Hw3-7EFZ!N3PI7(IX!suhC4~?;@qQ<=qPl&2s{0&F2D`?YhLo#mRu;>ufSqGWbM4+p)iX&l*BulS63p8M$lhdZ70pB#zklI>Mudx#ZI_7ai`O2Q}XWK(V<(@`$NFJkb3?ci#RB9phQ6<fB^^7IPr9QV&(kN+^y~S-FSMP2Nze}4Cs^o5o`lQm?@f&emcBIZf!1UtF2cQ2Z;*^9fzqIyKrI{(x|Z>VBp4fhd@rlJFivWsh7|zDt+<didG|<lt8hv+u`m_fc|(E2&nC@xd-kqo^JB_^G%<?U3AQ}UpBA&1>o-w&d#~VTw(JHQ%4!d0W>zA1aW7K9}9|2p+WN`@HF7+#UPE-qGE|V|JQcA11Z2b<`Ea{36Ot=VgPbaQIF)b74Q6RPw@Z7cVc`m5&`G#`U>R^y%XEGrU4%Z8kqkY7R<Z5fXW^C|Fwjt*fFSCoFC376JTM83=KFE!rFR3d4P*0Hz0AGr*BY7EIbL7zvMr?-P5<PHh|FcxyPf<GXK&oT<5juOdASiAV~rpoOn3HjYuRk=;g&5%s}EuSoA`W(CB%D6&LXpk-cAW!YM@_q4Br>ORL#zKHqNoM6JZdQUBjOGUU&~J)naR5Co7<Z$UD3{VSgqJr;@<<J!ad2TpIu!f`N)?=$mL1VM1`2_NDq?4=Qq11JY#K0zEIATD#&1xgw~A=re9d<*$mQfawmc&uCz3k*@O^2>JfIgZTtySVEDn_}aJ+Sn!>m7TJFBN^WSLN78P_HyR~-)#IF7SLPZzE&@)tuG7>un(}tfX9qp?h8@jb)yE(u$*!DL^yD^hpb#pr{BeGrpV%&0!Oq);9p;-5vdT20y>elxR9HAjXLLd4U)}^C^<5d<a!B&cl#RsbD8{2YZxvQ`o{sx;-!Zz(&3%bO<)Lk1nl0xK?D%J(@)b0iBHHpkWWt1B=YiTGSVUtVkjmw2$I57N<nb^OTzOdm_DvfF5%$z4n<!K#4s=bDLgZh6t0Q&7W{|xa3P4=XJK+3c{OGIk}%%Y7L@H6bkWG1#dpz!^cUWpxc3|3WHt_g@`S{^LZo_q`q_uv?tr$y08@wbb0|m<Q*?oJEU>+xjlr)?-u0YD<6jTgT4K1~Uu)Ga7!j3)B_jmy03{0m!@Gc<9VTo6>5)8`?QlLRdZTbqq}hEi38(#GD9d;t909_n{eMFr@(!}AWz`@{EuN$j<>E=YNz<laDVeQ`7+5}?7n0zc>wpI>SlU%Iy9+fNAVN$$IP1KHJsI-aGz!!gvFz`6XMxfxc~IV0Xp-XUTYaPjht8)8Jv+0;Fbi+FYbZFT+&6+TYapA^(kOslz9*ReQ)7yzG9J@vDb_<NNKnK@+F&SteOHkOG7`{uSpnmn!1)tSNG#bwM|!<DiHly300YBDts75Da0tM8vGVy0yVKBx)wEH2R4HJMokt%sW0DR&2X8{aSpLqV;uDAk>Fs%3Od`*v8d9(3$~qYxp1rMhQ*3QE{q9Y0@{d>P-TUw!CXXi!4gn|c!+tbbfH1};&Wig<bT*Fg+&BWMWE}x^+MBbYOP{y2$vZEbO{j6x2!}(~5PD<Tg&8ZUf)id5I~7~_0JAWiPv0@M*lF5e%+h`rWpRK6f8`KlVflsGY8r!Y-xb~w5gf<3q!*rh3MVVk-rB-L{M#%-ZH)YS1)_%j*hM;{zusZa#@0*HGK7F(q%+gmB&G1z6(e<)!jRvUa}C`JPR=GVVj^svqb!CcCm@Yd(E^2VMox)9!l5bl;Z$>SHj5Jg1R#=XZr-@TmiNY(Hbm(wL0U%Ts83j@wn+YnA~cVb2zxHQHCLsYknq}I%4vG*(Tqb0wHOzea20sDNN6YXzKiYv_2MMjAI6133`lH5L(+@A0mR71)eb>{p6Zm@r28(qbC628LX|_#Ab04ic~PV^i`9h2Spm{~m<>6larF8BJXB;aOa>7wR=<H-*I7~RBBx@079sJd=5wlz=Y3!A>K^TSucQWw?Av)_Ajyd)4k#tm5fRwRA{RHJ7YtAV^e(@_eFKyv_(r>-Gk`7)QMl#(0N>a615;>EKtdn>#c$pgkRbW6psmqCRtqQzpT_R!<U;O@&W+xTpZRQr%{M@fn!>raBa!6u)kW({<0Tx0OjN;i)U$d65^6jiT;mXaOHKs{u$x`?{Y4UE5U~;Iw^@hW`Su{J?;uNNuxHn^a2U_?PHTI1=PnRr#fHXOve9f=mz0djOwN_C5A*TOoCBUHOqS$I5h_Wd<SO{zJ9lc4Wpye}(@0xdF+Ip&2(?)Rv^Iy^F|*`>IFEGGbYw)FQkC8<gJz&cZ9e15Q#w-FGIwgHltjW<je#{+h*G45WJo9w!m$>*5DyhbmVgH(_YaesF!xS)+Y(@IXc&|?b+EngCOgab>au3>;Io~^{qpOC2<S>xTu_waYe08}9vsY2GGk1mW>G6cpI_5-8nia~qrj7ddmJT$c;eR33HPT~tF_a9q42w(&GT{4;t#wtG6)R(3D#v6-8lzRqSF1yt4Sco#y1hkK@xtLo1fEk7zM8E7zlyarm(}hk7lW;;8CxZRpHeBps1=BTFQBN#*{~X*lp!?lTS*Jzs=+gtX!&Ci_nZ>Rk=F<`rjc<^P>Mz!n8RV#Aje8<hR-vUjx)=(`ms%J6Q~MSyi>kuGW^62-MWG{{{|uLqcZRfI1WYqS08W9CfTLv#d@iDJGhhLWR6cQ5$T=d{}@yJ`3Q4ndUJPCD>y{s!&#)7x|mn8=f*N{exrh3>DkYpO?My#bR;QX)1qTDX;nk(g1f1nUdm)i1=%;3roy@6lOgJ_tQWk`pEr;O@3Eg2;2PbTGOhOe5qfqAL=-aBEBLBwF{x}OsxT8^!`nhlxsm)S>ihFsu~SLQ^|Ky6H!iNt)4*^w{#g?dPXxuhyOcqFDjTuzcghW4x)`Ha!GOE-5IO5c5g1_&uytvQ1wPTqyA{*`f|&a+ffRFgTm6U_@;P(B$tOY!##40cTV(&fp0d&c2n%Y$*##L^uW;9TK3?vFDQM(;G5#kp41ZD@`+yxuc;<e&H23=R`b_DA<wT><dMgwz(~7Lg|8Y?UF9nphuV&;R711kC<j(X%bDSpG)PB=Th97kBrjPlVX2*YZDZk!Hs1L{7D<?m*I_=!De$o(&Ik1-&m^2z$WW_0@^%bTuvD<)gnuEiFNdv~&fZ5O!Vmg5RrsF4Y`{5WTITZisZzHYZS#D5S(kKdOTclJrG{2hv^3&4Ulg+jXlO`6633lx8wgjstp-JlysVt~LZ4r7#@Dt~mHo*ip5=G}x-GUf8I~9zQW0e+3lP6Ynq2Zbxh;79PDx&Vhuu^q8f98zH!0xU7L!4g&=L<{D4--QB_HALV{4h~OR#(CRIvcO#Vui1GOFLby-5^ih>g^Jx$_@e`7E7hgXric%BomaN@k*z!z?^IOF>G-Wss?R;fym*aht%Guj%bfNyM=vv|o6)kp8^f+l!=}HN3u-D$IQuUo9$Uzm%$3*>r5^T}fAr{TNNsbZGS?&jyClxeLN12-X3l+R%Ypu^0(V(tQJj8~IZK0$OnK1!amTf&79g1m77`F8BXyKp(*B0Y$r?qx-=7N_hGe@l;b4$Y7x=N>GL&m1;JSWE#)#1uSmvef2T7(!;O*UjpvCeS3$%sM7!(2BB1~u--;pVI1~(RL)x9T*y61T?KN>ofT&4dTlDFt+nb>VNI{(T1?Y<9vx><o-Z<D#Og+$^c^0I4Djp&mX;b2Bt87oIM#mQ1p?_R^39V$c_8>=vNt-8z<C5uLz&Cc4j+wJWT?Lb_@Ys}1{R?OLt;Gpq7+bdvPca8X~@G!Gv=P-&iSHIWc*vu>}UySZ0!#CgSnC!=_5`(M>AFO-G|to)aLestUG|yoyi<5-cVr;70z&F9<*3BOeQfXr~;1|_>F0pjKiV`llM__jSQ0L#DFfdbN|;sn#_1^h9<sTn@Ihyfu#R*H6HeJkNCj4%_T|*?i3BQeB-buuecoNArVra`{jXBQw6<{Rj_b^V(d~xj%x~Y<rPnm42!qT7yRU7Qr$U%_77T`)ovesA%p!`vP~XB!9PLhH@GWW3Q5e%`W7Y=iUhn!)+zGKdbzQMMseO9WF}!&mndcdu;dz5pSMBgH}XL^iH4rMK-Q8g<5Jl&;gY&$E(KD;M6(zZMvx5h8O-S^s-B1!A6zGC78$8nNLxIInrEL))3g}d8NM299?6{^257zB7)Gcx%{}@EVGp%E?vSwu?v;R4-5BdeEqegf>h>&D;h=UY8pusyO>Ln@0rOj0cSAMa%3kO{WfHpfnwouBryi)ad;YvF>=DR(wQ5*^Qha&TG4@+M(G23Ly&ad(^CePW=jqgdC0@nGL`fF3GPI;z3{8^vN9@MBzTmcG$=%p(AYdhAdJTJOSe}H;Zeu^)PPNafdS#Q!I@k<Q*@>>mC#WT*r68}$D!D$h7O%XOAf~^ZcAf&QgNd#spC#$6RR}I<69+5xKCHYwlb!*5zw^NDEiaK6KIYQ4dKar20t^~i_mzC*$`T4*^XJAjB?yROf;X}9qS7?K74Gr8KZys9Omse;zIXBF(e^kH+QR@KPKJoWP^NS)AQN}I6>-k@KOCE7r2l|$_vSfB437NvuR7)>9r`8=FQB7WzBLL;3hufibsI<H5XKD-IU}H^dD>6;GP6v^N(Xcmbg}5HushGvEYzQSX+DK%P@iwIG*@M>ESPw(n`gL2bZa!ckp2)*O83$|rzBBU`=Kktv+ySRZ@V<qo$sry#1|r#^~1Mce);yfb0aS}<h|RCRv7c5sq44z+Ev7uzJW1!{u5nBq=_=t@8tsor;ObR*>B@wEd8>`bo%eny(d54{eAzRy}gg8r~8NJy^m-6ry_$DPl^nv`Ei&;lgmpsq=%j5gt_xspJky$gr<);MsitUl1#?*7npe!$Tm*qQFhN}g?HX(fq7`!%Jh!y=a0_F;!xLg-39CSETUb<)@gZp=tXlakDc6r1t!DEqydC3+h{k=?sJ&$;}FdtfEnfo$teBgHSe}wh^9a~CN_L&Hk?NQH}YWP)4a_B)6=a1AM}Ir*=Tas;CcQ_z&=Z^I=;>t33*-CSW}{ny7TV*{P+xsN$vnWbHd3ay=BXD?1v&Q*peWN#e5vXY*4R^PIkwE^yh0pf%eum+A0K1;LBeE+byqg%Ks9?aTE^m+Tfe}5vFK;_nJMJb`KBM*$8F*I7^?m8cp}RukfY<4nD~kAHGEqPb0j5+1w)Bfb+SaJnFc6+h>#+=0&H}5g^7grt||o>cePT&CQ*y7u%MyvES)K-e*cm)&jO)*9Cst+SuNC(R|rz*G%-k4vq=2qG9fAwc5^yS8PG<j1`0G`(5Z38x}HHWPsz44pU>isvO4GIBR|b*C)dhIb^Gkj$xcQPbP8l*_*~Ws=-Rvi^Xo8z1v+!V}B?L+j%fniw-+J1Mcd56|Byn#g<wb_DkbrG%iXfHz<D<AVN-prdlKEYuWf$JVXCH)R%;aUjxP4arWS|5yKWB3vJ*3ZL8UA)=b`cnmTYQy?1C9ffB?~?)sJn%Z4QPJ@#lVh*1KIdUy=!e&OD865X)i^;;l^^Zbi3AhoUp<+oPz#m0-x)=qm9ch#3hocG{>n@;8^T5!@Z17QSzx{Zd5efolXm2bji14<8xSANn*hL#t;mEx$*FXUsAhogu_591uiH*CC5gO)1=n^vs}ui!Oojoh2jR3rh=2B13%SGpl=H}-n!T)3fhe`3MXy<$&2%o*dq@NK%{LGms8;z5;gHp^88lp}{bEWnO;eRRBo<kGti@&@>Usq8lgDRG}2=#Wog27AXr#tdy0(AN+@=BDqPJ5t_mSU~!@L7^Mz=msTlxszOFf7++<Xd^3G;5O3r(PIsYB)55)hF)lx7Uj1p4L!>si4MgK17;pGl^Yp$b;eVA#U6gtGCPXlwsfz)OE-y3+~$P4+6G2$4M2787IU~9{k+XJd&zi(ry&Y-gU=pIa3*)fS~ILg*e>%M*)`fvyT7=)AwY}yXcXTm#Ng9X1DHE>7TLe6uVfTHscn%F;${k?hsY<d(4d^ll#G(4?zb>az;YiaZWky(!_j^=1H}3P(VObq){ifDnqqsa>36S#leZwpn4-8QB*G&Jg5}m6-S;YH{3KM!DH(uRR~j_p7k1-_Zokop2xa#SxTwxzp~aI9*dD{Lnqy*NvJTM(nV0kS)&T7>AQ8drPU7oiiiagsYN!u#JEN~XI%Y$0So%QDA-Vj~*j!hyAQq6?3zU%JX<&OQq1OPNV6m{lU2K$r^C01iy!l{d02NdnW^Zy&dX<x<5SNOlTG_L`Dd4{vEzRGfXlA6TtEy!_j*es6(?JJp13NjVw7`CCmN8Cb4{DyI!jgQcfT><5C?5eb831tQMEv~umWY4e(x=T2VVrm;_?HoMDdNLot*{PO+RT8QM&+rCJRP)|j}*3*K?O26<77OC#&uB?lCpqf3z(--xmQ~4&8FCCH%kTn;B#<thW|urwB^P_e9OX#X{t*#lr3jEm6|C01qAC_8;qcdXDW4%{M*W&hS}#x-W>36E1NHKDn`QC#;Sa7W>pDpNtd{v=mwMMwl_=%o>JJ-{$cZQ;8b+BX3SAGG*sDeuHd1-Ayl5Luex;1LfN-+;_bLUHFui*R=axk#f%rNjn+o>6bu=yCdi&)<va}OQ8;RiLic;Oe;sgx4L#cOL@acZ<<goalNe6q@|l6jLXz@t-%Ml5{`L1RU14>8ilWixX!QL%)5xE2e^_OIYHhaq?J(Mr=9Qh+?9R#YR@3<we&61%T3znU?f}^FJRkFETAYAfIN{$m;C8beZZ>5<=x)8XiJhHF6EA0XKsJZye%q<G))@oK&&)PC#U6h6eQOJ<DP4(BcH2TLJp^RtGJ-~BI>_+u!Co&+%#P9PE$lTfl{SOa+pa{#+u%g+W1IinB2}dOaNr^!o_+wC60bWqx5UPlpucd^i?Xz2efYJ6^^GmqSP;$$nzK;|kn@kP500GU(<3NeEO$28sCPCP8{4<AKea;xaJ3>54r?snhqMV6z}j<^n*~WSaK1oR$GDwK*TTHvR@elMK?w{fv5HY5Rdt8at!iW_>$^fa`gk@45eEG!byPKk%15;v>POIRSL&z+<2219%#i9p6-2~&ANR8`yRWpmsu@Y`ge3nX-~i(uCwknttmLrN;+)|<L9TkD^gEPDZV^i7DHIK%&)$%wzN=0@F!q#(6NuWb!G!O8m9lG;R1M>C$|>cn0MT+VE{(}<C7zoc<dK-(53{O&hEj7QU)8Q7w7}|8PAuFe2-dj^Lya!9l3ehGv`}~4S4z`hP!bR4K$*5D@?&ot4L;*>$K%60CGO6P6oj71JcmP|&ZtfwFTc|hcR>Oi3Rb63#^GeS3}-E98=ZyeHapC90pW59S31LzNP_cJ<E22;q)Y<)hL#u8r4c_30^~dHskAgU5TNRAL?sr+V;V--eNomD;Z0=2MRhFg8P2Q+i8)n>oJLZM1@IlDxSX+MzB>=@Hj+-N4YJ5$dN4sg^m;al3-tSef9Tq*o5Rt0GJz!ecNfT-PJGI_z`%n*8nRo7`Vyrw`_pM$*ahwT`HG^NNr|*1vZ~E$k#$gysI<VY82IK;%{k?Qa=y%Uq|%Tc4<p0x48E4|s=VSC2PHAFhNIBcxx*lG*SF1|4fbx|U@B^Pn%-8YOin?J1iNMq;KLQM@`K<>RJU4wrH`il*5aJ-m?)JvEs@eU<Xq}C(W~16h2>~lvjIsti~PN09{V>IP35wFdGMG3t*o0Rl}D!FaJcl0G7U^1gQN45>{zOGmd~xaH-_ImIx%4ns}rW+_+7}b_x&1sk-C&sPevf47Bu|wyTkd+2Kago^EyDo8Op2&2^qB@A-%#G<@8pVp?O|<Br`11S%n$eyc!h|t(Q$l62kuPrGn6&%~b3Jz1gIUqXa7{hsdC5bV+V@@{|b=bZ`k9v4xy!tC>xSA@f1H%QY!NmC3C!`oM{e;c`*Pi^fz!QEY%k^2W(GH8icV*h;K4e9rz94;iI!&|x*;#3>9H_JuGRw(HCTdJ1`}u9rqS(uFRRJ55`|$<<UFSeq6YMR{6AfiZ>)vnN*;cQQR+r0Jp14&XK;qlHw*Xu2G|>eg^S-6!UukLZtXFIZ%^UD+usi>+o?&q$?H3vmPNiRV(T->KN!NnX}RZ$@@p%O%EJtPYK$E9|el-%nY!X8SK$gS@h<mUIN~yzSMR*hQ_5u`PLJ{CZ*@m;qI8aSk-sSvCtLTjF^r70e@BpKPFjL~&hJPM0@wzr|~<@0XX!HyO9!yEB!yUkiM5VV3y2+O6f2WHL(W_@$>P{w-+IQ91rgU_$R00-_cr<tC523mdoebF%iQO}5Ovq14ci3Qh4uVy2ESKS<IlqtyoVa!Iu>)Z^)vX8g+WbFr^W>4pkk@yGY7bU5dQ8U|(n4D0ZqT^5v@bcmsr2in2gC>9L)U+p=KdJUtMndpJc3H*T-ji|LmRS2dWYWy^`BQ9!74-Xvg7rc@1yIn$*9KUDDwew4(Kb^tff6uOcS1WNBG`MQaWfE)XxledgqApPQu3*`Ph`Dse&5CcZy<^>=WlLIagIO7L%M7?xcSB48u`rx;G)RXLJEh9I9_PoncU_RHs~V>5)Uox)AXoRXS}?M(tlapZH9^!l`4Htfj1+CH1{g_o5Kc_IkU<nNfSea;A4`hESmK#YziO}!l?fHB)A|JhttZ7H(bNd`%X&aU2;aiaDh8Se(Lf7|9;21Kj`h1`*f3pQnA^Ja+%;8h#xU=Kis>Vbgyk32nLBH<>IkHF+Tp&dBYw(?)<uch$(CNw=mPE@bra0<sML!}?^;naRxQYU*}osc2njn^DohI}h*c}qr*ULrFQSV0&fc-g&g3>&$S=ar(Jt&OTuMFyD57!OxkWY}718^U^g0#sWT6L)oo4TRix5c@EG36p@ml>=)>pMPo@9^Jr9hTOc-lu8W^FV%-lgX^m{cKBp&3I?!8|!QEq%M<;;QsPjm6BCov4gNRCDU9VS_N>A*v=|U*YxahKPUO_(A;PiK=2w*@DR^28M0G5=}|v=D+qndd3ri0y71G#vemE{bID=?l7>+4I?-s#xssf<l_05Ob<S#+3-^q&ZLlPX%r}mPvztv+J|asFN`{nm8X7rv%*#>=zmzzAZWYfzdF0K+2sB~HA0A`N^o|#p|G0Jw-4_WdPp9X2WqXd2&F)|QUaYL1X@Nbw^Q;~OjBv(Ms6)Yab_U(q5&sfIzZ+lf*d2i46y8TGMARC6Qd2#jMr|>bJyK9e4n6!e>P!1jHA1Y&JKm8#6C%z16)J|_lQ=%22{}I9$(`bYMPW4=j_6T6uH^I3fVKZ*pw(!8vh|U0K43vP%0vzSUJHZ3YhzWW>tv{NW3UPp$#p{Oz1mlZLEGJxFw5g*qef`zBGyoZ5D+M{62=E?Bo}v2xk<-;b~IJg4kGxpRH(Q(;|x^YG1_UWz>sMOyfn<2cQzS&3OV?W{-%FVq6OD(dj%PdZX?x>Gnx)t707IoK3b_P?omYx>BC4lTAQlFdhDvLzchFNfld#Jp=19&kFz(IWttd<>M%8xaj$5^r&Le{?8~k&c~W7ty*2%T>+RBbcloW((aOGYRkIrmae*ZvVj!nV5>$Z-oFDRhCu?(Eu9AkCJeb%oXJqz6n#LyHqwAO^ngQ7=@0``{Tz4j^8up*B*Wp<zY>GnVZa{^ZNbLeuGMaq7IO`rCuDky-5t3HYDpb>ZH2`6Z)T<MvWMnspv|lF$C4<5Lyak3)cIJ4$hC0>HBmDZL52<Y$94wI=i<J=|H&ws5yp9n_K+<yBV1zngrQZX!5_s)W_M$ePh>pvrM6HNo;oTUG%Q%`xPtB0lJJMMCJ*hlXg3A@^}DfRwAf$xtYhi;qKa!6I7l<ZqOL3%D!K*(XKin-4dE-ua_c#{&0u-%<W;eHC#H1kS$17ab8QI)vHe*rhzymh`08D~!h%zvpEuEvjNtIkBdy<9Zo7_pqdRT02BeKbpsH_vaY%pSv1HiGlW>-g4MtOAHd>6A_-olO(m0p%cC)p~W>n6Hl(q%FLXyK?iYl=+TN^t~@v^Bb=Hy1};Z1nIRD`NzR_^u&?9-B0v(=f$G<IWVk@0l)EVH!A$T>}ZmD)C@eC36ZxUKO~X0~d$_AtsA^c@!D<Sn4zI3DCjFcEQazdsrw5`nBmVfIw6Odj2_G+BML2r@+9O&J7Ri=cD~0A9=RaNZ{FyO1v`!%W5lY&Ke3GIc*0avB^)R8sj6l4rh()HuJNMUA6*u{ZCdO=!sekU9`4<C>0P4t)!KJ1;OlF4lKCDt-dK;iYGEl|n<s!L*j*_OVu4#7`?XcEl~~Y_))7?Fjh0u~`;6!>LZLJ;{)g@TPj(mjPe5Y_pVcmbA{I0#*7%iI55KOd5cxI<ce^N;$D`vAF&6rQ;Y5llu9ldb^E^Sy82Rl`RKfo(P~A4gO*KHB3WmkDD3;ws9@D*w_&pO+kNw<cHUKCJ*=j_xbwU{lop!-SdN^L+8`M;p?MMXU^Wo)3c*f=k@;C!P`TZ>Qs9X-A8?NB!EmLQ5xjy2u+ZkDG{ZHLl4b3(GAGQ4$W6X)u<bm;yk)Qg{6S>Q(}R0jpT2A6lWk8-YV)x2Xb`%#UMM9w$M*0{nKwr&Sa4xx-w<>u8ER8DyDWIg8+qyqXgtG>_2p)uJ@7`%G^rV(H|J2$lHjWVBldJ-$tWm-*MP7P?_pc!BvbCvzHuJYt8#KWhjmLx~LAR9Ez3x+M!_fq_yQ@OU$6y`cIA348M!Pkr$H*mX%TN$Farb!|Q4a3ouq1%)ClbBxOe>$SIdimD{gsJBdO~Ze4-1mqcz7s@AqjEFqXuC6bL7Z9KCwjyP<VBTdPKyHEQ8MAP(hgwOe*p(puVFgjAWCKQZwJONBGrjHXkIzR%c)0t5>oYz?hNX)z*{-sz6_)TWG3{FyYCoUSU)IIa6Yh%nMIDs$YJUq~?!An;xv&DpMIs|Y7vX3C6WM>lgQ(&VYFwtJ+=h}pWPoW71%?yQuk5&l>UA=^SUrRU`$3#vK&0Y#e!OUSdd%a&tf2v0*cP})kY(B^7ttG?Y5L*uqvEO`Adbr!>tnMqIf^b~Irvzb$r1@hnLwPkJ96mufhW?8miA)iKqD#4OU|8`8jz`+9HRtid9s?qWx;1@D${S_NGwznuOIo|WT+)Y(Y2h%jz>;WI_%gSEjvJP0_*tcZM2*id2Wg;fyh;@?wZ@2s-Yt6W(EC3m*tXk_#BN6h+Ah=SKEYAfG-W#ZAksk+r+hR)#-!Rata9x=FMFj@e~0z%QzW3)CcZU<e`_S57E3^6@1$lMt$-?X4N2@mv1lhuW<h=OimAvk8_l-MS!B-(^8a}})5fEezDnO&;!>@tXrJ6_$a_h%=%ZKvYk%+DIo>@uJa_hAADkbZy0T1lM0rGnSqT6(Z1#y#iKfW*KhPpthWnLBhokfE{QnVl&MV}XAF+e3>}EuK8vlZE@+2A+<#xiaTG~bN8xTKj!5YhBV)gPSpVBd!&*$eyNAJ&^zdEmv_C9{tKRnl#w-g((m(#lnk9uFBTB&?dp(WazOA5%dW?gRW%Lx+YZtCrtslF?29%+F;sk1|-P@)cn*YfLT&+Mb$r7+-+m>n!vPRJ%4CCfB92b(hGp%){196z<T^K5$VV2Op^b2YY;q@9HUSX_#g=#ZTqXPO(&RA5jMMtWJWNUwngEv(Jm5`$|7aJSUr+UhJ8_PgX?Y3<C9km7Pi{jS5D9?Qze4y*M~BdU)X%Pd)~`sn*!g@9=w=?vymisK_oEdz&n8lW{s>}n+mTVF^*2r98;A&MGMfbUNf5{xvlRr7SB0(3qgR|Vq&mA)5Mqqr`Lq6{jxslUtHL22kX@6YghFd|*{6mef|XS_IcF6jP{6Ua(mib0*xadoxi4Ab2nYS+u<qR*A&KeHDrW0U@DHT`E1hvl8KKf>+8bPb@wbzQL5QsM>c*{dg5rG2<irt<dDFPQ^SZ@q<YeF<5lU01{^(W)!a#Gt&o$VPn;E^$hSRg~e|t#)hca^7tAD;?8kUg+GGU2W~58oI*SIK$W$ONuo`<E77UEn%pUWrbP|2KJilV_f}K7ktPCx-w!lNbk!^hz6y6c!H;4&C;4;AX<&IMf`J{aoyB()YLT4-=ue2HS|uR{Stqi7QM1qIZa_v(c<%q_NCE>7{e0SI>~5D=5AqcywdNbsCq&c*~-lbBIgIzXTCYz{jg8_v8Ws!7JO->;td^TM^A97`Q0uwj6xL{jAJTu2@J+P31$X3xNzdz>Tj3E2UMgU6pJ7|{fe12zvL-orI4eKokD%7Bw~BGs;19M_Gdd=K^?s6qzLjHN1noW_;s*x3&`8oR&(ojxos6I+_tLclrrO~eo;?RGi<csxPbmOr1M|&pQ_Ukm@ZULRtMPE0LLF+y+7Dv_wU`kzdP>_UY+iq{&Sh~9|x_@{!&t@^_^1TCCg$z;z`B23Oh|*h;w2|C@MZ!40l0QMp~C7Ey@XaXX*ooagMtItyf~;4`^1vkN%N<&rl3D)P5~>fM_@kZDbq~lLEd_r8vi9f0*UY?HF~PlQf4}U~3YiHXOI7AlW3v<X&qSWtCZ)(=$9mg;dK)kA?-wMu%-r@}&kUcol+UuDR_{$>thQ=LH(FRQCfG{Xs{zdI6NzTnnH-;O$m5+kAxZdY;beD{9T&&QdqJDkG&*#9?g$QF{qrHO4jaR#A?H!Ye2VoU^wC{Qb{Rl7Ak3Jgr_#o}KTWBVT`*nEd$0uiN3~{UhE-I3b0MBdatzMDX<yZrSq6(22sqSlvbN1%>lEodX)L)3m^5BRYvyu_j)MIWa{pL%6I6TypKWWKYpWn7Z%>Az=a07ji9B-CP)brF5Ore0kU+3(b@(K=mf3-mcx~V4YdJk^MBQb}|N>22~UOKhSjFi240z#BZb4_WrX$+~PrPucWCN$9P*B-Hlj`5z&myg>(H>(tkecTU%_m9})HK>5=(Y1c*xlD+(OHr@Ju0hkQIqp0Ze@;88*3)IF+v+#AD#FC#glCpG_orT;=Syh@Or(MsG|;^apAg5tO{x!pr*OR?PL8|O|WW<hPJG{1BnGic26fO@iQ$;#?zUe)x@@I6u&OpxjxhBxswzd{OZiAX;18WMZh6QHXOp{fd^Apb<c34YIvPf_%j1cf37EmpB&;ko;dvlQ?Y8GOI$vfVT9(0}~0`Vq05!T@Ftrf8Q`E>gu3Hi|61zK$|m$x>OKstF`7liZ`ky9{Lmu>gWjap>8$mKwWT*t=M*JmipQcW1n5Y2NtpD~q;YD!p)!R09H3h(4eK|02Vyh71cU*9HwL%NJZEeY7i3JX}uj4IyEkBcA!Rrjiq)_jmH$p=eFM^}sM)t?&?T>><!S&rNj*mB%$zM)}6(ji_Ykm+)?EMRxTaO+$yRpQK)N_0`W%+m7a>)zgmV70-U<Jzn3iwsEzB-d~KA7c_0gQ5o)@yd;&?<_vGfq)D;qX)Tj1SL@Q4*0)WO&5w)q?PkX^O*WkW$(`7`QZU=JJ?E{S`StN69`M#SE|wO99GIQ11~!l#UpaW`Mr_R%zo=%p0qb{9WrA4rLieBShHl(=Eg2Y(pgOKct*SXNIT8PT<1((^YMu_aO}vRSuksNhXk>hW!;a{LgRijAsV5rJyLAXr-wghj3k>}MA0NwyeAy<mJ6a#`<q7k`R~a;_;hlhEyfrH&q4>3Ftav&Z)`U&Ds8o?cZuLc7P5%DyH@3{Tl4vjjI$C*J>@hvo4<A+TFU==!>Ir6f(?T;!W;uc+@yE^UV`jCR1*!E;EBQT@feSP=exWKgU%-3J`&8Ixd3^BbuN=UWo~`<itoa}GK9)w9^!K8Jd9PMObIL{4j~!Y|PsFi46pz8dOLD2xN{VU0D+%X{kt_+UWM0$QL#a~d-&$5gm2wPLpqxLI*xMIDH8W4qxna-jlG&|i1P01LP9&C86ObrtNT0*%HQEinIi&BM6t}!K>|TVcymn<(^y%YcP-%nIwLH9aL4I4&>LEJTERRt`A&kl(KvwT8sYtGYwE$}^|L5u&JT>0P4|MbY`_NJ9ok$!tK85U+Di(Sm{Et<!bn&?g^Hz}pRh<-X=W*i%HB<FkA73nsW!0?@eTB{ZNpY^89<u>!>@AJkQ0G3{6s;XWe__U8R!n6eIxcW(T{}{{r?MZb0Gel$z>GF9P(dIhqC$T8AeQ-Z(;xUm6NdzOL>!QoiUYFwORL%DKd3x}6TVa((id&)H-JX30j`I@%XyLIu$0917uy2<`!f`ZOZADU;0qoTtfPxxt6YIqeno|cH<v4;d>p3c?WQx!(wlfluH9UDl}oYAt~9wA5CjSIvX~&4_q4De<jwkEXb>v3%AlDG{BZmb?AAg|5v)-0g(in@OK%!Zt3gy?9_yW=SHvP&3^1m=l}#n-W1M^+@Q_}NdZikoq$l|i*Z3hXzHlM^h}CP7KfP$}3`Qf=v@Uz^!oznhnqjMj#akP#u#FE{{1grG2?>gvWxaxd#kZkYn~JwKHrgX94y}y(SloUa!^1+&m#qO7YKN_zjUD_2g<A~WdNIS(PiA15t<lbifVVc=%?+U1_>P8{p&=vbBp095;L-E58ouD{g*Pp){-9SjzF{A}fB$}>UX-9W5=P-P#^5B+&Z6ryay}khKI@imDYTk1sG^kNHe?#uclGc@(|iu2oAcdeXPchJ;8#7+r_X}$1vxLUKzy76S=L>v(-imk=dRspiF^EmQf#M*k68=`{L$Fla%9__&~kp-2{%W>b{P7#&tOy@!D#OooibuU2$@uxpQ;q)-=n{!)L_*hUn`ZOL;&@z?*~^+;p(?L+D)U|hC#FaGDvd^Hpj3Q;?`C@#78`nqB?3K(j%W@X&O(Cyo92yjURk1Wph)3mc0nSTW~Izhy<6<3Va&=*_8!yz{dYopw<&A=9?iq%_ct1f~@o>a#5Gtg?B~G3nN`PSAuA@t}uTS#%*?#K}k1lAwSDI2nl{Uyml=-?WJvYukHa9s|K=kYdmeJAfMtHYz(5PEUto;s2(esQ;$GhF<Tud;hCM)5{%XMixr(!@`q}TE<3+{lU)tN{>~uMg|(fD3BJ9x0=((vX7y=hC3WX(FPTIbeb5oBUiPW%*<ov=-F$d+Eo@-(5hA9vrM=cqrs2OZGfaal=!hcUMvn|dRrQIW<uN0NkBAvLtdAKvd?;q*ikK#g0k#)BdzPrStQbTXql;qC7;$KH2%6<L#q2yak0-+(p2CwJ9Jl6DpK0A9pUly;Xm^02qVzqoDQbVg0#J0>B{L_M6pcgyebrnh8Q<s;`6|Mf91ch@{eAb;1#mZgSIz#bY*QxOw<#J*;oSiyIB>v-qU6D=Y&_dGBS+n6vyV6h6eI8a=&?85?DOuJ7v4G?n~ZcJo#9QRuT{6=>|*Ym;g!gOV>j7`m7%iKoi_>Mbcy0iFV!%RdJf~#+l*eLTz(7mdR}rD-nFjHLy1>(c)(C;=(f)>7_F96m=yb3zP^$AC@G80l1N|PItfH{!9yCSSuvOw6o^X<l;^D(C-I@FDBX2+bwx51^bUvjkzY!M^!Mog3^fPI01g*2kB{NCW2NX-*mG-i>a-QgVJ`0Ha>Jv4HycGj23^9FGpveYkH4Xthau`?Kgc3lorIw!qG=$#XEEDz|BBIqm0n9uFclN@N?7GF3ykbgWRtZ+iFMeE9!2x0sc(i0A=MhW=Wi<*NA@FOU8+?@ts1apJY$A)rnVBf0k5dw?B;e4&c^Ymu<G~1oTj`M&i)-nnRZlY3zCG<9Ps$?tqpf~QbLWWQg4=AKYoOgtP!kttLa#MKj}?l?8Tc+HOXiX&IXM@xhg1tB(Q=4SW2*CsO-qUBqYlhbg>Hgg32oYbj70kCl*^Z2MP>1guYe|p%UV$hG=<!F4kwC8Ha6K0DYO&xnhOG)+2kSJ$mG8JF;i570A+;XKAnOiZvZ#0Q8U?aFNPt{eyK`CUklvkkH0Clgy8Sx1NAK41`0|Xr@R|+7EHT8aQU)7s(U}*2YrCSJxRM#ERmE1Z8uP>vge8?ed{0CQ&6=Yy(L8t-}u6Z%Jlz-%8-}`U|U@f}8>FQEuIfP5vuQr_O<1q&0hbO{*!q)@$#Gs?pS1+g}d&Xs)-*`U=S5owvCFczp@r(+EcDAb173xg2zBlUX3iQ5EE6^g_|2yi9?Qp7Kcj_Pwk4C@SBiZCc0uM;W@K;~tmcJ38*Z3gOXl-&<ikI_{|v%A?~Rsc;@0_e~knqvIa9-?g9#UHKE@g@hK`(X<F`N{cS}1%6%$^}rmX6iYCo2r#pwLENALDwzcqzKNISJTkl>v?74$Of{&Qcp%idRYZ_`Zv_b{nV(`d(o1}?+Cc*33Fgt^fDmZq2lcLOTte$d3JAgIZ(}KCthK6WD&fD5>fm22g%6vcwFn+vmI;H^+eS7H>*w^W9>}tSJwebXQSxB^xy-+M1q||NltAR~B`(-2fP9=u2>4@}fA)&{c-tW%@XsX<++A6174B%r(q|iI#wq=_OW|p8$`(AoR|2Nls)bxLk5w1(ddTPw?zEaeD_~a-_=eX*Vc&BT&c$j+^e0U#Etm{3_a@D5@eWuvgR5T#3FwVD_YrXL6(JK4BY^>`FAMOgM+Hr-Y#AL)wX$h+c_5kS5lJ*9ooP2^m@$fBD{38+b?sHNV>E#W8YO!jBsrNLRz0|vRQ)lj&jj!!(QoM_;n350uHhVm<W$|+c@e3XnHDy;H5+$@1!r-88<1MQ4E+YOR%LNnGPB#Ea`FgRef#-ANv;Nva`=_7^!pa>n=RLN3{WuepH+Av0rS&A&iix_PUInXoqG8uoeZPQKG>;utz)Xxn_wlnv#kY<g1Ym-t1%A?#g7~ZO)A;j>icP>ezC_OmN-dpwAsn5svp3xi<QNtV#57<bl*?WOHpY>a6E5X=2*0VQww0XpUw-%4rWbnV{uu`?S-?Mss1U2A9l5XUxp^M>Ni2zwXZdr@{lX7k|<o92(^i@S*8)wgMfY~th0v-O+hLNNMOU%daIuL-dNq}Tb;-|eY1gn1NB$v*`&u;e=bvz1f-J2v{};uVE=$i`|irtO|^=l$kMjYsI;g&)m8RMTjrL}R>e6P`58}90VoxkQ7c=PzL`aS_K$fst4`a)?wmERW~~#E#JAh<j{f-YEi1g_dv4_mTG)DLxhY?15=RCQvMsjasJxXzO>tXp#a<InpVGgDF-F~YsHZ=JK5h<`xp<GUJX_sfEZmbAj!P_Bv%e2stJuymlp9cndjHgvNKAXhpkj_I=dk%}5dXT=GPlP5_aeR$b*XEut6)ibZTYJOn_(#WqlUn?@brjb$G<h7Ft+t2V_Sdx*w%k|Y=+pt9uaZIH=VZiFmHiXHne5M-(gE@+AtBbH0j`imtnWo%dlcy`#Zrbh!4i{k4WsO(x-iNhX!u_nkFRGZ_?FBFVcw5u=r(=hJEie&@T^ho>_WoIky9HCb1-^TB%1ZkToClCcREL3WtMkwkW~l^3hd8?%YNhhG3s36dk1Of%Qfb(Ky)=@<J9<<1Hi|9ze?y#%!&AU#4C_fsS<?zQqvy?~(lX?D8@}K{%KBEvFb~>HK=kpPP_PnyZfU59ip~ciuav&XM!RIe-jPAp+GQ1+|GC=Pmrwr=N~P#~I=9=|eayzVp8*w?Sd4UFbM?T;0v^*!elS&oz<PVv(E%a|$R=y?awHT-gcO&DvK(AVc?s6?qgLA8VIK2zd{=P8XU+<Z6^c<!z;TQ`vCM7Yq|6sZEUMZTK<O(zkZC5udURtiPUr(8RCCs;zt>lE3}6k?XoA@+PffHqmc2TYY7>!uEgK9AayBr;H`|-TSI3#rN+DYNvy;<+pFD>I<||YL)e+vBe8Au(0ZMa(TV6XsaZP+C6TyT089*l^#FcjA~o=q^|25P}HF@Y%YwUT65_DXnv$Mz)#9Fq1I~Ufk}2L&V*@dfvxW${*k$bHoVZr7OQSw6~ZmCxUk;FxyBIil*<L@Gq37eUQ?tZw!$%H#w{2jt@%izPYC)ZSe~wQ)C|lB<V6KZ-#Tgne#yuhbQ?|KtHbPQG}@=vd56mCL*?qjXAX330_TFb47;St?812_?#~Od3SlE8oz(cW+hc9VQL=|uk;05!P>xdhz0w`58ZUn6(UxV)K{DMtPw^_J8aNkt9S*j<1T|(o_omWj-h}cl9!9o#!YEE+<l@Fc8Pyi=`BeySo_n#_g>Y1W@JI0EiCA`|vY=#$xL_;+2Z6!3NAirCCnl=Z(eW8TN>=5gRWQfF3BA2GVC@;<BbqSqwM{yk&jKjKw++!Teyh+?h&_;1I$Kp2$@bPNSBsuV?U)FNCpi>2lywYp4Vut6|3}OS=65Jz9OK)oC8ANcr1=C5OTABwJ!S4gziJu)z-q8mMi4dfjY?SKapS<?S5${%5K)*Sj2p$4YkI~i%`TRZedr*(#auOIs1~&c)S<@Z?8qrlSsXWrKN|FcAHGJX67(@nmxzeRYYJ6^@ut*u&W>p@UVojTilC`<a0G_y<@0O=l0;q#&o!A<f>+``nY6q~2Xh@opv)_ep?10+24~pCs$*QX6}5TM^1)g+p9|ZLP}1-I*eq3dxAcHEj!#9H0b<yMowg;j1#4$YnVzc{Cx9E?V8O+dH}8WOPn*`<nY>*UMsfpJvPlWOV?4ROFiBiPz7n}~ih+E~zE2y3?OtWY;UIIKvXiq{%MIT~=`<?fs4=B1Ni}@n;UqEOO%n!@@$245Gv2hWUE{8j2dLJqg;*3=h#^Jz^9j(5`dk%-7nD%~OLk$QhC_vdBts1V-OjFoe&kVOH@ha&nPdDyr7;Dx>xD8I-S>*ID-uY^1NXn&#RBW=c)VU8v4L0^5M{zG12q8N7mJB_`8{y&?E2=S)4GC8Em(W*n|aPRKeqwNT%kO+%SY(L21nz%C6zJmR)B=>ih5t<DG(+g#)la3Y}o4sf!pihkb6D1!$ZGJo(bm}987v+Kub7THfHzFI?gjbXgg^x%7;<~fWJ)8-IIbxP2#>hk5dS#%jERv=$zkFPN5sgO`O3lLrQ%4?ETT+?)%;2<JY_AyO+;|p$GK+=a<jmaD<0Tn3T(BaOgWe4iFY(^kK1{ae*G6y?Su=>Y-M?w}E5C^7yjs1*-g@A_k9EF5z-o{oh*rHkq1ce9Z%0K49VTb=bAQxww30EE#lAD-exJNF+f*M%5~|LjINIBeKWj{0Q*qp;+ub%<U3~!e`(AA9sJBLj'
METADATA = {'created_utc': '2026-09-19T06:09:44.590266+00:00', 'sha256': {'executor.bat': '0e94f5e5e91a22081a524c2a851ee2db7e3ca66b4393a74908d757e5a5db9d52', 'app.py': '555d8436351653b950e330732d33346a777b808f0d0c4ec3e1086cbc551a62d8', 'ani_handler.py': 'ffd86332a44bbb4dabed2b37d7fcba9c16456fac5ac9e898eb1cb2079df44eeb'}, 'app_exe': 'ANI_Studio_Pro_2026_3.exe', 'handler_exe': 'ANI_Handler.exe'}
ROOT = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "ANIFileApp"
SRC = ROOT / "src"
BIN = ROOT / "bin"
BUILD = ROOT / "build_snapshot"
STAGING = ROOT / "staging_snapshot"
LOG = ROOT / "logs"
APP_EXE = BIN / METADATA["app_exe"]
HANDLER_EXE = BIN / METADATA["handler_exe"]


def join_key(*parts):
    return "\\".join(str(part).strip("\\") for part in parts if str(part))


def log(message):
    LOG.mkdir(parents=True, exist_ok=True)
    with (LOG / "snapshot_installer.log").open("a", encoding="utf-8") as stream:
        stream.write(str(message) + "\n")


def run(command):
    command = [str(item) for item in command]
    log("> " + subprocess.list2cmdline(command))
    subprocess.check_call(command, cwd=str(ROOT))


def embedded_files():
    files = json.loads(zlib.decompress(base64.b85decode(PAYLOAD)).decode("utf-8"))
    for name, text in files.items():
        actual = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if actual != METADATA["sha256"][name]:
            raise RuntimeError(f"Embedded {name} failed SHA-256 validation.")
    return files


def write_files(files):
    for folder in (ROOT, SRC, BIN, BUILD, STAGING, LOG):
        folder.mkdir(parents=True, exist_ok=True)
    destinations = {
        "executor.bat": ROOT / "executor.bat",
        "app.py": SRC / "app.py",
        "ani_handler.py": SRC / "ani_handler.py",
    }
    for name, destination in destinations.items():
        destination.write_text(
            files[name],
            encoding="utf-8",
            newline="\r\n" if name.endswith(".bat") else "\n",
        )


def compile_sources():
    run([sys.executable, "-m", "py_compile", SRC / "app.py", SRC / "ani_handler.py"])


def build_onefile(script, destination):
    name = destination.stem
    work = BUILD / name
    stage = STAGING / name
    shutil.rmtree(work, ignore_errors=True)
    shutil.rmtree(stage, ignore_errors=True)
    stage.mkdir(parents=True, exist_ok=True)
    run([
        sys.executable, "-m", "PyInstaller",
        "--noconfirm", "--clean", "--onefile", "--windowed",
        "--name", name,
        "--distpath", stage,
        "--workpath", work,
        "--specpath", BUILD,
        script,
    ])
    built = stage / destination.name
    if not built.is_file():
        raise RuntimeError(f"PyInstaller did not create {built}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(built, destination)
    shutil.rmtree(stage, ignore_errors=True)


def register_ani():
    classes = join_key("Software", "Classes")
    progid = "ANIStudio.ani"
    command = f'"{ROOT / "executor.bat"}" "%1"'

    keys = {
        join_key(classes, ".ani"): ("", progid),
        join_key(classes, progid): ("", "Windows Animated Cursor - ANI Studio Pro"),
        join_key(classes, progid, "DefaultIcon"): ("", f'"{APP_EXE}",0'),
        join_key(classes, progid, "shell", "open", "command"): ("", command),
        join_key(classes, "Applications", APP_EXE.name, "SupportedTypes"): (".ani", ""),
        join_key(classes, "Applications", APP_EXE.name, "shell", "open", "command"): ("", command),
    }
    for key_path, (value_name, value) in keys.items():
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
            winreg.SetValueEx(key, value_name, 0, winreg.REG_SZ, value)
    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, join_key(classes, ".ani", "OpenWithProgids")) as key:
        winreg.SetValueEx(key, progid, 0, winreg.REG_NONE, b"")
    subprocess.run(["ie4uinit.exe", "-show"], check=False)


def create_shortcut():
    desktop = Path(os.environ.get("USERPROFILE", Path.home())) / "Desktop"
    shortcut = str(desktop / "ANI Studio Pro.lnk").replace("'", "''")
    target = str(APP_EXE).replace("'", "''")
    working = str(ROOT).replace("'", "''")
    script = (
        "$w=New-Object -ComObject WScript.Shell;"
        f"$s=$w.CreateShortcut('{shortcut}');"
        f"$s.TargetPath='{target}';"
        f"$s.WorkingDirectory='{working}';"
        "$s.Save()"
    )
    subprocess.run([
        "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script
    ], check=False)


def main():
    if sys.platform != "win32":
        raise SystemExit("Run this installer on Windows.")
    try:
        for process_name in {APP_EXE.name, HANDLER_EXE.name, "ANI_App.exe", "ANI_Handler.exe"}:
            subprocess.run(
                ["taskkill", "/F", "/IM", process_name],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        time.sleep(1)
        files = embedded_files()
        write_files(files)
        compile_sources()
        run([sys.executable, "-m", "pip", "install", "--upgrade", "PyQt6", "pyinstaller"])
        build_onefile(SRC / "app.py", APP_EXE)
        build_onefile(SRC / "ani_handler.py", HANDLER_EXE)
        register_ani()
        create_shortcut()
        (ROOT / "snapshot_manifest.json").write_text(
            json.dumps(METADATA, indent=2), encoding="utf-8"
        )
        subprocess.Popen([str(APP_EXE)], cwd=str(ROOT))
        print("ANI Studio snapshot installed to:", ROOT)
    except Exception:
        LOG.mkdir(parents=True, exist_ok=True)
        error = traceback.format_exc()
        (LOG / "snapshot_installer.log").write_text(error, encoding="utf-8")
        print(error)
        raise


if __name__ == "__main__":
    main()
